var request = require('request');
var inquirer = require('inquirer');
var cheerio = require('cheerio');
var fs = require('fs');

var user_path;
var user_category;
var uri;
var page = 0;
var download_links = [];
var child;
var previewWith;
var previewClose;
var userDefinedPath;
var user_config_object;

exports.scrape = scrape = function(path, config_object, definedPath) {
    user_path = path;
    previewWith = config_object.previewWith;
    previewClose = config_object.previewClose;
    userDefinedPath = definedPath;
    user_config_object = config_object;

    if(definedPath !== true){
        var lastChar = user_path.substr(user_path.length - 1);
        if (lastChar !== "/" && user_path !== null) {
            user_path = user_path + "/";
        }
    }

    fetchImage();
};

function fetchImage() {
    if (download_links.length < 1) {
        //search a new page
        scrapePage();
    } else {
        //download the next image
        showImage();
    }
}

function scrapePage() {
    //add to page count
    page++;

    uri = "http://photocollections.io/page/" + page + "/";

    //run the request
    request(uri, function(error, response, body) {
        //console.log(body);
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);

            $('article.format-image').each(function(index, download) {
                var imagePush = [];
                //image preview
                imagePush[0] = $(download).find('figure.post-image a img').attr('src');
                //download link
                imagePush[1] = $(download).find('figure.post-image a').attr('href');
                download_links.push(imagePush);
            });

            console.log("Links grabbed from page " + page);
            //console.log(download_links);
            fetchImage();

        } else {
            console.log("There was and error loading usplash.");
        }

    });

}

function showImage() {
    if (download_links.length < 1) {
        fetchImage();
    } else {

        var preview = download_links[0][0];
        var download_link = download_links[0][1];
        var spawn;

        if(previewWith === "w3m"){
            spawn = require('child_process').spawn;
            ls = spawn('w3m', [preview], {stdio:'inherit'});
        } else if(previewWith === "feh"){
            spawn = require('child_process').spawn;
            ls = spawn('feh', ['-g 640x480', preview]);
        } else {
            console.log("can't preview image (only feh & w3m are supported.)");
        }

        ls.on('close', function(code) {

            inquirer.prompt({
                type: "input",
                name: "save",
                message: "Do you want to save that image? [y/n]",
                validate: function(value) {
                    if (value == "y") {
                        return true;
                    } else if (value == "n") {
                        return true;
                    } else {
                        return "Please enter y or n";
                    }
                }
            }, function(answer) {
                if (answer.save === "y") {
                    saveImage();
                } else if (answer.save === "n") {
                    removeFromArray();
                }
            });

        });

        if(previewWith === "feh"){
            setTimeout(function() {
                ls.kill('SIGINT');
            }, previewClose);
        }
    }

}

function saveImage() {
    if (userDefinedPath === true) {
        userPath = user_config_object.savePaths;
        var savePath = [];

        for (var path in userPath) {
            //console.log(userPath[path].path);
            savePath.push({
                'key': userPath[path].path,
                value: userPath[path].path
            });
        }

        inquirer.prompt([{
            type: "list",
            name: "save_path",
            message: "Where do you want to save that image?",
            choices: savePath
        }], function(answer) {
            downloadImage(download_links[0][1], answer.save_path);
            download_links.shift();
            showImage();
        });

    } else {
        downloadImage(download_links[0][1]);
        download_links.shift();
        showImage();
    }

}

function removeFromArray() {
    download_links.shift();
    showImage();
}

function downloadImage(user_image, path) {
    var img_id = /[^/]*$/.exec(user_image)[0];
    var img_url = user_image;
    var image;

    if(path){
        image = path + img_id;
        console.log(image);
    } else {
        image = user_path + img_id;
    }

    // var image = user_path + img_id;
    download(img_url, image, function() {

    });
}


var download = function(uri, filename, callback) {
    request.head(uri, function(err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};
var request = require('request');
var inquirer = require('inquirer');
var cheerio = require('cheerio');
var fs = require('fs');

//http://alpha.wallhaven.cc/latest?page=3
var user_path;
var user_category;
var search_term;
var user_sort;
var uri;
var page = 0;
var download_links = [];
var child;
var previewWith;
var previewClose;
var userDefinedPath;
var user_config_object;

exports.scrape = scrape = function(category, path, config_object, definedPath) {
    user_path = path;
    user_category = category;
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

    if (user_category === "Search") {
        inquirer.prompt({
            type: "input",
            name: "search",
            message: "What do you want to search for?"
        }, function(answers) {
            search_term = answers.search;

            var sortCat = ["Relevance", "Random", "Date Added", "Views", "Favorites"];

            inquirer.prompt({
                type: "list",
                name: "search",
                message: "How do you want to sort?",
                choices: sortCat
            }, function(answer) {
                user_sort = answer.search;
                fetchImage();
            });
        });

    } else {
        fetchImage();
    }
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

    console.log("Searching page " + page + " for images.");

    //setting up our url depending on selected category
    if (user_category === "Latest") {
        uri = "http://alpha.wallhaven.cc/latest?page=" + page;
    } else if (user_category === "Featured") {
        uri = "http://alpha.wallhaven.cc/random?page=" + page;
    } else if (user_category === "Search") {
        if(user_sort === "Relevance"){
            uri = "http://alpha.wallhaven.cc/search?q=" + search_term + "&categories=111&purity=110&sorting=relevance&order=desc&page=" + page;
        } else if(user_sort === "Random"){
            uri = "http://alpha.wallhaven.cc/search?q=" + search_term + "&categories=111&purity=110&sorting=random&order=desc&page=" + page;
        } else if (user_sort === "Date Added"){
            uri = "http://alpha.wallhaven.cc/search?q=" + search_term + "&categories=111&purity=110&sorting=date_added&order=desc&page=" + page;
        } else if (user_sort === "Views"){
            uri = "http://alpha.wallhaven.cc/search?q=" + search_term + "&categories=111&purity=110&sorting=views&order=desc&page=" + page;
        } else if (user_sort === "Favorites"){
            uri = "http://alpha.wallhaven.cc/search?q=" + search_term + "&categories=111&purity=110&sorting=favorites&order=desc&page=" + page;
        }
    }

    //run the request
    request(uri, function(error, response, body) {

        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);

            $('.thumb-listing-page li').each(function(index, download) {
                var imagePush = [];
                //image preview
                imagePush[0] = $(download).find('.thumb img').attr('data-src');
                //download link
                imagePush[1] = $(download).find('.thumb a.preview').attr('href');
                download_links.push(imagePush);
            });
            console.log("Links grabbed from page " + page);
            fetchImage();

        } else {
            console.log("There was and error loading wallhaven.");
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
    request(user_image, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);
            var download_url = "http:" + $('img#wallpaper').attr('src');
            var img_id = download_url.split('http://wallpapers.wallhaven.cc/wallpapers/full/').join('');

            if(path){
                image = path + img_id;
            } else {
                image = user_path + img_id;
            }
            download(download_url, image, function() {

            });
        }
    });
}


var download = function(uri, filename, callback) {
    request.head(uri, function(err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};
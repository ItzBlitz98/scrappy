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

exports.scrape = scrape = function(category, path) {
    user_path = path;
    user_category = category;
    var lastChar = user_path.substr(user_path.length - 1);
    if (lastChar !== "/" && user_path !== null) {
        user_path = user_path + "/";
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

    //setting up our url depending on selected category
    if (user_category == "All") {
        uri = "https://unsplash.com/filter?_=1424237751902&category%5B2%5D=0&category%5B3%5D=0&category%5B4%5D=0&category%5B6%5D=0&category%5B7%5D=0&category%5B8%5D=0&page=" + page + "&scope%5Bfeatured%5D=0&search%5Bkeyword%5D=&utf8=%E2%9C%93";
    } else if (user_category == "Featured") {
        uri = "https://unsplash.com/?page=" + page + "&_=1423015199287";
    }

    //run the request
    request(uri, function(error, response, body) {

        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);

            $('.photo-container').each(function(index, download) {
                var imagePush = [];
                //image preview
                imagePush[0] = $(download).find('.photo a img').attr('src');
                //download link
                imagePush[1] = $(download).find('.photo-description h2 a').attr('href');
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

        var spawn = require('child_process').spawn,
            ls = spawn('feh', ['-g 640x480', preview]);

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

        setTimeout(function() {
            ls.kill('SIGINT');
        }, 3000);

    }

}

function saveImage() {
    downloadImage(download_links[0][1]);
    download_links.shift();
    showImage();
}

function removeFromArray() {
    download_links.shift();
    showImage();
}

function downloadImage(user_image) {
    var img_url = "https://unsplash.com" + user_image;
    var img_id = user_image.split('/photos/').join('').split('/download').join('');
    var image = user_path + img_id + '.jpg';
    download(img_url, image, function() {

    });
}


var download = function(uri, filename, callback) {
    request.head(uri, function(err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};
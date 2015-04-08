var request = require('request');
var inquirer = require('inquirer');
var cheerio = require('cheerio');
var fs = require('fs');

//http://alpha.wallhaven.cc/latest?page=3
var user_path;
var user_category;
var search_term;
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

    if (user_category === "Search") {
        inquirer.prompt({
            type: "input",
            name: "search",
            message: "What do you want to search for?",
            validate: function(value) {
                if (value == "y") {
                    return true;
                } else if (value == "n") {
                    return true;
                } else {
                    return "Please enter y or n";
                }
            }
        }, function(answers) {
            search_term = answers.search;
            fetchImage();
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

    //setting up our url depending on selected category
    if (user_category === "Latest") {
        uri = "http://alpha.wallhaven.cc/latest?page=" + page;
    } else if (user_category === "Featured") {
        uri = "http://alpha.wallhaven.cc/random?page=" + page;
    } else if (user_category === "Search") {
        uri = "http://alpha.wallhaven.cc/search?q=" + search_term + "&categories=111&purity=110&sorting=views&order=desc&page=" + page;
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

        var spawn = require('child_process').spawn,
            ls = spawn('feh', ['-g 640x480', preview]);

        ls.on('close', function(code) {

            inquirer.prompt({
                type: "input",
                name: "save",
                message: "Do you want to save that image? [y/n]",
            }, function(answers) {
                if (answers.save === "y") {
                    saveImage();
                } else if (answers.save === "n") {
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
    request(user_image, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);
            var download_url = "http:" + $('img#wallpaper').attr('src');
            var img_id = user_image.split('http://alpha.wallhaven.cc/wallpaper/').join('');
            var image = user_path + img_id + '.jpg';
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
(function() {
    var unsplash = require('./unsplash.js');
    var wallhaven = require('./wallhaven.js');
    var photocoll = require('./photocollections.js');
    var inquirer = require('inquirer');

    var category, path;
    exports.get = get = function(site, config_object, definedPath) {

        if (site === "unsplash.com") {
            inquirer.prompt({
                type: "list",
                name: "category",
                message: "What category to scrape?",
                choices: ["All", "Featured"]
            }, function(answers) {
                category = answers.category;
                inquirer.prompt({
                    type: "input",
                    name: "path",
                    message: "Where do you want the images downloaded too? (Absolute path)"
                }, function(answers) {
                    path = answers.path;
                    unsplash = unsplash.scrape(category, path);
                });
            });
        } else if (site === "wallhaven.cc") {
            inquirer.prompt({
                type: "list",
                name: "category",
                message: "What category to scrape?",
                choices: ["Latest", "Random", "Search"]
            }, function(answers) {
                category = answers.category;
                inquirer.prompt({
                    type: "input",
                    name: "path",
                    message: "Where do you want the images downloaded too? (Absolute path)"
                }, function(answers) {
                    path = answers.path;
                    unsplash = wallhaven.scrape(category, path);
                });
            });
        } else if (site === "photocollections.io") {

            if(definedPath == false){
                inquirer.prompt({
                    type: "input",
                    name: "path",
                    message: "Where do you want the images downloaded too? (Absolute path)"
                }, function(answers) {
                    path = answers.path;
                    photocoll = photocoll.scrape(path, config_object);
                });
            } else {
                path = false;
                photocoll = photocoll.scrape(path, config_object, definedPath);
            }



        }

    };
}).call(this);
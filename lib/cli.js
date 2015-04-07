(function() {
    var unsplash = require('./unsplash.js');
    var wallhaven = require('./wallhaven.js');
    var inquirer = require('inquirer');
    var category, path;
    exports.get = get = function(site) {

    	if(site === "unsplash.com" ){
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
    	} else if (site === "wallhaven.cc"){
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
    	}

    };
}).call(this);
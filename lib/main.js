(function() {
    "use strict";

    var inquirer = require('inquirer');
    var cli = require("./cli");
    var yaml = require('js-yaml');
    var fs = require('fs');
    var path = require('path');
    var appDir = path.dirname(require.main.filename).split('bin').join('');
    var conf_file = appDir + "config.yaml";
    var site;

    //ask some questions on first run
    try {
        var config_object = yaml.safeLoad(fs.readFileSync(conf_file, 'utf8'));
        var definedPath = config_object.savePaths !== undefined;

        inquirer.prompt({
            type: "list",
            name: "site",
            message: "What site do you want to search?",
            choices: ["unsplash.com", "wallhaven.cc", "photocollections.io"]
        }, function(answer) {
            cli.get(answer.site, config_object, definedPath);
        });

    } catch (e) {
        console.log(e);
    }

}).call(this);

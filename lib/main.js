(function() {
    "use strict";

    var inquirer = require('inquirer');
    var cli = require("./cli");
    var site;

    //ask some questions on first run

    inquirer.prompt({
        type: "list",
        name: "site",
        message: "What site do you want to search?",
        choices: ["unsplash.com", "wallhaven.cc"]
    }, function(answer) {
        cli.get(answer.site);
    });

}).call(this);
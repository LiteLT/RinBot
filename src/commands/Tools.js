const { CommandCategory } = require("../index.js");

module.exports = class extends CommandCategory {
    constructor(name) {
        super(name, "The Tools category contains several useful commands for getting info easy. Whether it be a " +
        "member, role or color info: the stats are right there.");
    }
};
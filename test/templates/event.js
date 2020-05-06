"use strict";

const { EventListener } = require("../../index.js");

module.exports = class extends EventListener {
    constructor(...args) {
        super(...args, {
            once: false,
            enabled: true
        });
    }
};
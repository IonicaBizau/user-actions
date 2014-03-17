// Bind and Events dependencies
var Bind = require("github/jillix/bind")
  , Events = require("github/jillix/events")
  ;

/**
 *  This module creates the UI part for user actions in a DMS
 *  application.
 *
 * */
module.exports = function init (config) {

    // get the module
    var self = this;

    // call Events
    Events.call(self, config);

    // run binds
    if (config.binds) {
        for (var i = 0; i < config.binds.length; ++i) {
            Bind.call(self, config.binds[i]);
        }
    }

    /**
     *
     *  updateActionControls
     *
     *  Arguments
     *    @options: an object containing the following fields:
     *      - TODO
     *
     *    @callback: the callback function
     *
     * */
    self.updateActionControls = function (options, callback) {

        // call the server operation
        self.link("getUserControls", {data: options}, callback);
    };

    // ready
    self.emit("ready", config);
};

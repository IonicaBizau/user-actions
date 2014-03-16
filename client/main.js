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
     *
     * */
    self.updateActionControls = function (options, callback) {

        // TODO
        // create the crud object
        // var crudObject = {
        //     t: options.template
        //   , q: $.extend(
        //            options.filter
        //          , { _id: options._id }
        //        )
        // };

        // // search the items
        // self.emit("find", crudObject, function (err, items) {

        //     // handle error
        //     if (err) {
        //         return callback (err, null);
        //     }

        // });
    };

    // ready
    self.emit("ready", config);
};

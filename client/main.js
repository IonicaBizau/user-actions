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

    // module cache
    self.cache = {
        // { "selector": jQueryObjectsMatchedBySelector  }
        selectors: {}
    };

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

        // conversions and defaults
        options = Object(options);
        callback = callback || function () {};

        // call the server operation
        self.link("getUserControls", {data: options}, function (err, responseObject) {

            // handle error
            if (err) {
                return callback (err, null);
            }

            // get selectors
            var selectors = Object.keys(responseObject);

            // each selector
            for (var i = 0; i < selectors.length; ++i) {

                // get the current selector
                var cSelector = selectors[i]
                  , $jQueryObject = self.cache.selectors[cSelector]
                  ;

                // the jquery object was taken from cache
                if (!$jQueryObject) {
                    $jQueryObject = self.cache.selectors[cSelector] = $(cSelector, self.dom);
                }

                // show it
                if (responseObject[cSelector]) {
                    $jQueryObject.show()
                // hide it
                } else {
                    $jQueryObject.hide()
                }
            }

            // callback
            callback (null, responseObject);
        });
    };

    /**
     *  user-actions#runAction
     *
     *  This function calls the server operation which validates the
     *  rights of this user to run the action.
     *
     *  Arguments
     *    @options: object
     *    @callback: the callback function
     *
     * */
    self.runAction = function (options, callback) {

        // conversions and defaults
        options = Object(options);
        callback = callback || function () {};

        // call the server operation
        self.link("runAction", {data: options}, callback);
    };

    // ready
    self.emit("ready", config);
};

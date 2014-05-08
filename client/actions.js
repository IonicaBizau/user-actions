// Dependencies
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

    // normalize the configuration
    self.config = config;
    self.config.ui = self.config.ui || {};
    self.config.ui.selectors = self.config.selectors || {};
    self.config.ui.selectors.action = self.config.selectors || "[data-action]";

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
     * updateActionControls
     * This function updates the user controls in UI
     *
     * @param options: TODO
     * @param callback: the callback function
     * @return
     */
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

            // hide all the actions first
            $(self.config.ui.selectors.action, self.dom).hide();

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

                // show the action
                if (responseObject[cSelector]) {
                    $jQueryObject.show()
                }
            }

            // remove corner radius classes
            $(".btn-group button:visible").removeClass("radius-left radius-right");

            // update BS3 button group buttons corner radius
            $(".btn-group button:visible")
                .first()
                .addClass('radius-left')
                .end()
                .last()
                .addClass('radius-right');

            // callback
            callback (null, responseObject);
        });
    };

    /**
     * runAction
     *
     * This function calls the server operation which validates the
     * rights of this user to run the action.
     *
     * @param options: TODO
     * @param callback: the callback function
     * @return
     */
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


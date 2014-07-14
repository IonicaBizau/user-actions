// dependencies
var MongoDb = require("mongodb")
  , ObjectId = MongoDb.ObjectID
  ;

//  crud role cache
//  {
//      CRUD_ROLE_ID: CRUD_ROLE_DOCUMENT
//  }
var CrudRoleCache = {};

/**
 * getUserControls
 *
 * This function returns an object in the following format:
 * {
 *     SELECTOR: true
 *   , ANOTHER_SELECTOR: false
 * }
 *
 * This object will be interpreted on the client side: `SELECTOR` will be visible
 * and `ANOTHER_SELECTOR` will be hidden.
 *
 * Example
 *
 *     SERVER                                          CLIENT
 *     Role Object
 *     -----------                                     Selectors
 *     {                                               "[data-action='delete']"
 *         name: ...                                   "[data-action='update']"
 *       , actions: [
 *             {
 *                 template: link.data.template
 *               , filter:   link.data.filter
 *               , selector: link.data.selector
 *             }
 *         ]
 *     }
 *
 *     ----> each action --> Crud
 *
 *     {
 *         "[data-action='update']": true
 *       , "[data-action='delete']": false
 *     }
 *
 * @param link The mono link object
 * @return undefined
 */
exports.getUserControls = function (link) {

    // get allowed actions for this user
    getAllowedActions (link, function (err, responseObject) {

        // handle error
        if (err) { return link.send(400, err); }

        // success response
        link.send(200, responseObject);
    });
};

/**
 * runAction
 *
 * This operation runs an user action running the validations
 * on the server side.
 *
 * @param link The mono link object
 * @return undefined
 */
exports.runAction = function (link) {

    // get allowed actions for this user
    getAllowedActions (link, function (err, responseObject) {

        // handle error
        if (err) {
            return link.send(400, err);
        }

        // get current action
        var cAction = link.data.cAction;

        if (!cAction) {
            return link.send(400, "Missing current action");
        }

        // not allowed
        if (!responseObject[cAction]) {
            return link.send(403, "You are not allowed to run this action.");
        }

        // emit some event. Sombody must listen this event and to handle
        // it correctly
        M.emit("user-actions:run-action", link, responseObject, link.data);
    });
};

/*********************
 * Private functions *
 *********************/

/**
 * getAllowedActions
 *
 * This function returns via callback the allowed actions for the
 * current user.
 *
 * @param link: The mono link object
 * @param callback: the callback function
 * @return undefined
 */
function getAllowedActions (link, callback) {

    // this object will be sent back to client
    var responseObject = {}

        // get the data sent from client
      , data = link.data = Object(link.data)
      ;

    // missing item id
    if (!data.itemId) { return callback ("Missing item id."); }

    // missing template id
    if (!data.templateId) { return callback ("Missing template id."); }

    // get the crud role
    getRoleObject(link, function (err, crudRole) {

        // handle error
        if (err) {
            return callback (err);
        }

        // get role actions
        var actions = crudRole.actions || [];

        if (!actions.length) {
            callback(null, {});
        }

        // each action
        for (var i = 0, l = actions.length, complete = 0; i < l; ++i) { (function (cAction) {

            if (cAction.display === "strict" && cAction.template !== data.templateId) {
                responseObject[cAction.selector] = responseObject[cAction.selector] || false;
                // are we done?
                if (++complete === l) { callback (null, responseObject); }
                return;
            }

            // get filter object (filter can be an object or a string,
            // but this function is supposed to callback an object only)
            getFilterObject (cAction, link, crudRole, function (err, filter) {

                // handle error
                if (err) { return callback (err); }

                // create the crud object
                var crudObject = {
                    templateId: data.templateId
                  , query: filter
                  , role: link.session.crudRole
                  , session: link.session
                  , noCursor: true
                };

                // find the items via crud
                M.emit("crud.read", crudObject, function (err, items) {

                    // handle error
                    if (err) { return callback (err); }

                    // no items found, no action (unless the item is already set)
                    if (!items.length) {
                        responseObject[cAction.selector] = responseObject[cAction.selector] || false;
                    }
                    // a visible action
                    else {
                        responseObject[cAction.selector] = true;
                    }

                    // are we done?
                    if (++complete === l) { callback (null, responseObject); }
                });
            });
        })(actions[i]); }
    });
}

/**
 * getFilterObject
 * This function computes the filter object by providing the
 * action object (@cAction). The filter field from @cAction
 * can be an object or a string. If it is a string, the module
 * emits a server event that has the following format:
 *
 * "userActions:<filter value>"
 *
 * The event data is sent in the following parameters:
 *  - link
 *  - crudRole
 *  - the callback function
 *
 * The callback function will be called from the custom script
 * or another module with the following parameters:
 *  - err: an error that appeared in the custom script/another module
 *  - computedFilter: an object containing the query passed to mongo
 *  - appendIdAndTp: if `false`, _id and _tp fields will NOT be set
 *  to the final filter
 *
 * @param cAction: the action object
 * @param userData: the link data that came from client
 * @param crudRole: the crud role object
 * @param callback: the callback function
 * @return undefined
 */
function getFilterObject (cAction, link, crudRole, callback) {
    var data = link.data;

    // verify if the filter exists
    if (!cAction.hasOwnProperty("filter")) {
        return callback("Action filter missing!");
    }

    // check if filter is an object
    if (cAction.filter[0] === "{" || cAction.filter === "") {

        var filter = {};

        if (cAction.filter[0] === "{") {
            // deserialize the filter
            try {
                var filter = JSON.parse(cAction.filter);
            } catch (e) {
                return callback ("Invalid action filter :" + e);
            }
        }

        // append _id and _tp fields
        filter._id = String (data.itemId);
        try {
            filter._tp = ObjectId (cAction.template);
        } catch (e) {
            return callback (e);
        }

        // callback filter
        callback (null, filter);

    } else {
        // handle string type: emit server event, then interpret the result
        if (cAction.filter.constructor.name === "String") {
            return M.emit ("userActions:" + cAction.filter, link, crudRole, function (err, computedFilter, appendIdAndTp) {

                // handle error
                if (err) { return callback (err); }
                if (!computedFilter || computedFilter.constructor.name !== "Object") {
                    return callback ("Invalid filter.");
                }

                // if false, we don't have to append the _id and _tp fields
                if (appendIdAndTp === false) {
                    return callback (null, computedFilter);
                }

                // try to set _tp
                try {
                    computedFilter._tp = ObjectId (cAction.template);
                } catch (e) {
                    return callback (e);
                }

                // override the _id
                computedFilter._id = String (data.itemId);

                // finally we can callback
                callback (null, computedFilter);
            });
        }
    }
}

/**
 * getRoleObject
 *
 * This function callbacks the crud role object from the database
 * using CRUD or from CrudRoleCache object.
 *
 * @param link: the Mono link object
 * @param callback: the callback function
 * @return undefined
 */
function getRoleObject (link, callback) {

    // stringify the crud role
    var stringifiedCrudRole = link.session.crudRole.toString()
      , crudRoleInCache = CrudRoleCache[stringifiedCrudRole]
      ;

    // the crud role already is in cache
    if (crudRoleInCache) {
        return callback (null, crudRoleInCache);
    }

    // create the crud object
    var crudObject = {
        templateId: "000000000000000000000002"
      , query: {
          _id: stringifiedCrudRole
        }
      , role: link.session.crudRole
      , session: link.session
      , noCursor: true
    };

    // find the items via crud
    M.emit("crud.read", crudObject, function (err, items) {

        // handle error
        if (err) { return callback (err); }
        if (!items || !items.length) {
            return callback ("No crud role found with this id.");
        }

        // get the first element from array
        crudRoleObject = items[0];

        // save the new crud role in cache
        CrudRoleCache[stringifiedCrudRole] = crudRoleObject;

        // callback
        callback (null, crudRoleObject);
    });
}

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
 *
 *  user-actions#getUserControls
 *
 *  This function returns an object in the following format:
 *  {
 *      SELECTOR: true
 *    , ANOTHER_SELECTOR: false
 *  }
 *
 *  This object will be interpreted on the client side: `SELECTOR` will be visible
 *  and `ANOTHER_SELECTOR` will be hidden.
 *
 *  Example
 *
 *      SERVER                                          CLIENT
 *      Role Object
 *      -----------                                     Selectors
 *      {                                               "[data-action='delete']"
 *          name: ...                                   "[data-action='update']"
 *        , actions: [
 *              {
 *                  template: link.data.template
 *                , filter:   link.data.filter
 *                , selector: link.data.selector
 *              }
 *          ]
 *      }
 *
 *      ----> each action --> Crud
 *
 *      {
 *          "[data-action='update']": true
 *        , "[data-action='delete']": false
 *      }
 *
 *
 * */
exports.getUserControls = function (link) {

    // get allowed actions for this user
    getAllowedActions (link, function (err, responseObject) {

        // handle error
        if (err) {
            return link.send(400, err);
        }

        // success response
        link.send(200, responseObject);
    });
};

/**
 *  user-actions#runAction
 *
 *  This operation runs an user action running the validations
 *  on the server side.
 *
 * */
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
        M.emit("user-actions:run-action", link);
    });
};

/**
 * private: getAllowedActions
 *  This function returns via callback the allowed actions for the
 *  current user.
 *
 */
function getAllowedActions (link, callback) {

    // this object will be sent back to client
    var responseObject = {}

        // get the data sent from client
      , data = link.data = Object(link.data);

    // get the crud role
    getRoleObject(link, function (err, crudRole) {

        // handle error
        if (err) {
            return callback (err);
        }

        // get role actions
        var actions = crudRole.actions;

        // each action
        for (var i = 0, l = actions.length, complete = 0; i < l; ++i) {

            // anonymous function
            (function (cAction) {

                // set the _id of the current item
                cAction.filter._id = String(data.itemId);

                // also, the template
                cAction.filter._tp = ObjectId(cAction.template);

                // create the crud object
                var crudObject = {
                    templateId: data.templateId
                  , query: cAction.filter
                  , role: link.session.crudRole
                  , session: link.session
                };

                // find the items via crud
                M.emit("crud.read", crudObject, function (err, items) {

                    // handle error
                    if (err) {
                        return callback (err);
                    }

                    // convert cursor to array
                    items.toArray(function (err, items) {

                        // handle error
                        if (err) {
                            return callback (err);
                        }

                        // set a true/false value for this selector
                        responseObject[cAction.selector] = Boolean(items.length);

                        // complete?
                        if (++complete === l) {
                            callback (null, responseObject);
                        }
                    })
                });
            })(actions[i]);
        }
    });
}

/**
 * private: getRoleObject
 *
 *  This function callbacks the crud role object from the database
 *  using CRUD or from CrudRoleCache object.
 *
 *  Arguments
 *    @link: the Mono link object
 *    @callback: the callback function
 *
 * */
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
    };

    // find the items via crud
    M.emit("crud.read", crudObject, function (err, crudRoleObject) {

        // handle error
        if (err) {
            return callback (err);
        }

        // convert cursor to array
        crudRoleObject.toArray(function (err, items) {

            // handle error
            if (err) {
                return callback (err);
            }

            // handle error
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
    });
}

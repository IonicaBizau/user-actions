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

    // get the data sent from client
    var data = Object(link.data)

        // this object will be sent back to client
      , responseObject = {}
      ;

    // get the crud role
    getRoleObject(link, function (err, crudRole) {

        // handle error
        if (err) {
            return link.send(400, err);
        }

        // get role actions
        var actions = crudRole.actions;

        // each action
        for (var i = 0, l = actions.length, complete = 0; i < l; ++i) {

            // anonymous function
            (function (cAction) {

                // set the _id of the current item
                cAction.filter._id = String(options._id);

                // also, the template
                cAction.filter._tp = ObjectId(cAction.template);

                // create the crud object
                var crudObject = {
                    templateId: data.template
                  , query: cAction.filter
                  , role: link.session.crudRole
                  , session: link.session
                };

                // find the items via crud
                M.emit("crud.read", crudObject, function (err, items) {

                    // handle error
                    if (err) {
                        return link.send(400, err);
                    }

                    // set a true/false value for this selector
                    responseObject[cAction.selector] = Boolean(items.length);

                    // complete?
                    if (++complete === l) {
                        link.send(200, responseObject);
                    }
                });
            })(actions[i]);
        }
    });
};

/**
 *  user-actions#runAction
 *
 *  This operation runs an user action running the validations
 *  on the server side.
 *
 * */
exports.runAction = function (links) {
    link.send(400, "Not yet implemented");
};

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

        // handle error
        if (!crudRoleObject || !crudRoleObject.length) {
            return callback ("No crud role found with this id.");
        }

        // get the first element from array
        crudRoleObject = crudRoleObject[0];

        // save the new crud role in cache
        CrudRoleCache[stringifiedCrudRole] = crudRoleObject;

        // callback
        callback (null, crudRoleObject);
    });
}

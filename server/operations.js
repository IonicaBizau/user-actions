//  crud role cache
//  {
//      CRUD_ROLE_ID: CRUD_ROLE_DOCUMENT
//  }
var CrudRoleCache = {};

/**
 *
 *  user-actions#getUserControls
 *
 *  TODO
 *
 * */
exports.getUserControls = function (link) {

    // get the data sent from client
    var data = Object(link.data)
      , data.filter = Object(data.filter)
      ;

    // set the _id of the current item
    options.filter._id = String(options._id);

    // create the crud object
    var crudObject = {
        templateId: String(data.templateId)
      , query: data.filter
      , role: link.session.crudRole
      , session: link.session
    };

    // find the items via crud
    M.emit("crud.read", crudObject, function (err, items) {

        // handle error
        if (err) {
            return link.send(400, err);
        }

        // TODO
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
 *
 *  This function callbacks the crud role object from the database
 *  using CRUD or from CrudRoleCache object.
 *
 *  Arguments
 *    @link: the Mono link object
 *    @callback: the callback function
 *
 * */
function getCrudRole (link, callback) {

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

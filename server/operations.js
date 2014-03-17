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

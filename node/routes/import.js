var ERR = require("async-stacktrace");

module.exports = function(app) {

    var hasPadAccess = require('./preconditions').hasPadAccess(app);
    var getPad = require('./preconditions').getPad(app);

    var abiwordEnabled = function abiwordEnabled(req, res, next) {
        //if abiword is disabled, skip handling this request
        if(app.settings.abiword == null)  {
            res.send('not implemented', 404);
        } else {
            next();
        }
    };

    //handle import requests
    app.post('/p/:pad/import', abiwordEnabled, hasPadAccess, getPad, function(req, res, next) {
        app.importHandler.doImport(req, req.pad, function(error, _) {
            if(error) {
                next(error);
            } else {
                app.padMessageHandler.updatePadClients(req.pad, function(error){
                    if(error) {
                        next(error);
                    } else {
                        res.send("ok");
                    }
                });

            }

        });
    });
};

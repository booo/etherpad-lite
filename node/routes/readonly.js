module.exports = function(app) {

    var hasPadAccess = require('./preconditions').hasPadAccess(app);
    var getPad = require('./preconditions').getPad(app);

    var getPadId = function getPadId(req, res, next) {
        app.readOnlyManager.getPadId(req.params.id, function(error, padId){
            if (error) {
                next(error);
            } else if (padId == null) {
                res.send('404 - Not Found', 404);
            } else {
                req.params.pad = padId;
                next();
            }
        });
    };
    //serve read only pad
    //FIXME use preconditions
    app.get('/ro/:id', getPadId, hasPadAccess, getPad, function(req, res, next) {

        //render the html document
        app.exporthtml.getPadHTMLDocument(req.pad, null, false, function(error, html) {
            if (error) {
                next(error);
            } else {
                res.send(html);
            }
        });
    });
};

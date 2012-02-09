module.exports = function(app) {

    var hasPadAccess = require('./preconditions').hasPadAccess(app);

    //serve read only pad
    //FIXME use preconditions
    app.get('/ro/:id', function(req, res, next) {
        var html;
        var pad;

        app.readOnlyManager.getPadId(req.params.id, function(error, padId) {
            if(error) {
                next(error);
            } else if(padId == null){
                res.send('404 - Not Found', 404);
            } else {
                //FIXME this
                //we need that to tell hasPadAcess about the pad
                req.params.pad = padId;
                hasPadAccess(req, res, function()
                {
                    app.padManager.getPad(padId, function(error, pad) {
                       if(error){
                           next(error);
                       } else {
                          //render the html document
                          app.exporthtml.getPadHTMLDocument(pad, null, false, function(error, html) {
                              if (error) {
                                  next(error);
                              }
                              else {
                                  res.send(html);
                              }
                          });
                       }
                    });
                });
            }
        });
    });
};

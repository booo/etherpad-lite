/**
 * Handles the export requests
 */

/*
 * 2011 Peter 'Pita' Martischka (Primary Technology Ltd)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var os = require('os');
var fs = require("fs");

var async = require("async");
var ERR = require("async-stacktrace");

var exporthtml = require("../utils/ExportHtml");
var exportdokuwiki = require("../utils/ExportDokuWiki");
var settings = require('../utils/Settings');

var tempDirectory = "/tmp";

//tempDirectory changes if the operating system is windows
if(os.type().indexOf("Windows") > -1)
{
  tempDirectory = process.env.TEMP;
}

/**
 * do a requested export
 */
exports.doExport = function(pad, rev, type, callback) {

  //if this is a plain text export, we can do this directly
  if(type == "txt" || type == "wordle") {
      if(rev){
        pad.getInternalRevisionAText(rev, function(error, text) {
            if(error) {
                callback(error, null);
            } else {
                callback(null, text.text ? text.text : null);
            }
        });
      } else {
        callback(null, pad.text());
      }
  } else if(type == 'dokuwiki') {
      //render the dokuwiki document
        exportdokuwiki.getPadDokuWikiDocument(pad, rev, function(error, dokuwiki) {
          if (error) {
            //FIXME 500 new Error(500, "A Message")
            callback("docuwiki export problem", null);
          } else {
            callback(null, dokuwiki);
          }
        });
  } else if(type == 'html') {
      exporthtml.getPadHTMLDocument(pad, rev, false, function(error, html){
        if(error) {
            callback(error);
        } else {
            callback(error, html);
        }
      });
  } else {
    var fn = callback; //FIXME ugly
    //abiword export
    var abiword = require("../utils/Abiword");
    var html;
    var randNum;
    var srcFile, destFile;
    var content;
    async.series([
      //render the html document
      function(callback) {
        exporthtml.getPadHTMLDocument(pad, rev, false, function(err, _html)
        {
          if(ERR(err, callback)) return;
          html = _html;
          callback();
        });
      },
      //decide what to do with the html export
      function(callback)
      {
            //write the html export to a file
            randNum = Math.floor(Math.random()*0xFFFFFFFF);
            srcFile = tempDirectory + "/eplite_export_" + randNum + ".html";
            fs.writeFile(srcFile, html, callback);
      },
      //send the convert job to abiword
      function(callback) {
        //ensure html can be collected by the garbage collector
        html = null;

        destFile = tempDirectory + "/eplite_export_" + randNum + "." + type;
        abiword.convertFile(srcFile, destFile, type, callback);
      },
      //send the file
      function(callback) {
        //FIXME async!
        content = fs.readFileSync(destFile);
        callback();
      },
      //clean up temporary files
      function(callback) {
        async.parallel([
          function(callback) {
            fs.unlink(srcFile, callback);
          },
          function(callback) {
            //100ms delay to accomidate for slow windows fs
            if(os.type().indexOf("Windows") > -1) {
              setTimeout(function() {
                fs.unlink(destFile, callback);
              }, 100);
            } else {
              fs.unlink(destFile, callback);
            }
          }
        ], callback);
      }
    ], function(error) {
        if(error) {
            callback(error);
        } else {
            callback(null, content);
        }
    });
  }
};


var fs = require('fs');
var lwip = require("lwip");
var webshot = require('webshot');
var express = require('express');
var bodyParser = require('body-parser')
var ECT = require('ect');
var ectRenderer = ECT({ watch: true, root: __dirname + '/views', ext : '.ect' });
var app = express();
var Firebase = require('firebase');
var bookmarkbase = new Firebase('https://bookmarked.firebaseio.com/');
var firebaseSecret = require("./firebasesecret.js").secret;
var FirebaseTokenGenerator = require("firebase-token-generator");
var tokenGenerator = new FirebaseTokenGenerator(firebaseSecret);
var AUTH_TOKEN = tokenGenerator.createToken({ "uid":"provider:synecy", "isAuthenticated": true }, 
                                            {"expires": Math.floor((new Date).getTime()/1000)+60*60*24*365*2});
var webshotOptions = {
  windowSize: { width: 1650, height: 1050 },
  shotSize: { width: 'window', height: 'window' },
  userAgent: "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36"
}

app.use(bodyParser.json());
app.use(express.static('bower_components'));
app.use(express.static('static'));
app.use(express.static('images'));
app.set('view engine', 'ect');
app.engine('ect', ectRenderer.render);


// REST

app.get('/', function (req, res) {
  res.render('index');
});


app.get('/api/all', function (req, res) {
  bookmarkbase.once('value', function(dataSnapshot) {
    dataSnapshot.forEach(function(childSnapshot) {
      var childData = childSnapshot.val();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(childData), null, 3);
    });
  });
});


// @Request: {"key":"-JqkBsDnNYhW1SCW7tuh"}
app.post('/api/remove', function (req, res) {
  var key = (req.body.key) ? req.body.key : "";
  res.setHeader('Content-Type', 'application/json');
  if ( key.length > 0 ) {
    bookmarkbase.once('value', function(dataSnapshot) {
      if ( dataSnapshot.child("bookmarks/"+key).exists() ) {
        keyRef = new Firebase("https://bookmarked.firebaseio.com/bookmarks/"+key);
        keyRef.remove(function(error) {
          if (error) {
            res.end(JSON.stringify({ status: 'failed', reason: 'Unable to remove firebase child.' }, null, 3));
          } else {
            res.end(JSON.stringify({ status: 'success', key: key }, null, 3));
          }
        });
      }
    });
  } else {
    res.end(JSON.stringify({ status: 'failed', reason: 'Invalid bookmark data provided.' }, null, 3));
  }
});


// @Request: {"key":"-JqkBsDnNYhW1SCW7tuh", "title":"postman", "url":"https://www.getpostman.com/", "folder":"", "tags":[]}
app.post('/api/edit', function (req, res) {

  var key = (req.body.key) ? req.body.key : "";
  var title = (req.body.title) ? req.body.title : "";
  var folder = (req.body.folder) ? req.body.folder : "";
  var tags = (req.body.tags) ? req.body.tags : "";
  var url = (req.body.url) ? req.body.url : "";

  res.setHeader('Content-Type', 'application/json');
  if ( (key.length > 0) && (title.length > 0) && (url.length > 0) ) {
    var imageName = url.replace(/.*?:\/\/(www)?/g, "").replace(/[^a-zA-Z0-9]/g, "").substring(0, 22)+ Math.random().toString(36).substring(7) +'.jpg';
    bookmarkbase.once('value', function(dataSnapshot) {
      if ( dataSnapshot.child("bookmarks/"+key).exists() ) {
        if ( url != dataSnapshot.child("bookmarks/"+key).val().url ) {
          webshot(url, "images/"+imageName, webshotOptions, function(error) {
            if (error) {
              res.end(JSON.stringify({ status: 'failed', reason: 'Unable to render page image.' }, null, 3));
            } else {
              lwip.open("images/"+imageName, function(error1, image) {
                if (error1) {
                  res.end(JSON.stringify({ status: 'failed', reason: 'Unable to open rendered image.' }, null, 3));
                } else {
                  image.resize(730, 450, "lanczos", function(error2, tumbnail) {
                    if (error2) {
                      res.end(JSON.stringify({ status: 'failed', reason: 'Unable to resize image.' }, null, 3));
                    } else {
                      tumbnail.writeFile("images/"+imageName, function(error3) {
                        if (error3) {
                          res.end(JSON.stringify({ status: 'failed', reason: 'Unable to write tumbnail image file.' }, null, 3));
                        } else {
                          bookmarkbase.child("bookmarks/"+key).set( {title:title, url:url, imageurl:imageName, folder:folder, tags:tags}, function(error4) {
                            if (error4) {
                              res.end(JSON.stringify({ status: 'failed', reason: 'Unable to push firebase data.' }, null, 3));
                            } else {
                              res.end(JSON.stringify({ status: 'success', imageurl: imageName, url: url, title:title, folder:folder, tags:tags }, null, 3));
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        } else {
          bookmarkbase.child("bookmarks/"+key).set( {title:title, url:url, imageurl:dataSnapshot.child("bookmarks/"+key).val().imageurl, folder:folder, tags:tags}, function(error5) {
            if (error5) {
              res.end(JSON.stringify({ status: 'failed', reason: 'Unable to push firebase data.' }, null, 3));
            } else {
              res.end(JSON.stringify({ status: 'success', imageurl: dataSnapshot.child("bookmarks/"+key).val().imageurl, url: url, title:title, folder:folder, tags:tags }, null, 3));
            }
          });
        }
      }
    });
  } else {
    res.end(JSON.stringify({ status: 'failed', reason: 'Invalid bookmark data provided.' }, null, 3));
  }
});


// @Request: {"title":"postman", "url":"https://www.getpostman.com/", "folder":"", "tags":[]}
app.post('/api/save', function (req, res) {

  var title = (req.body.title) ? req.body.title : "";
  var folder = (req.body.folder) ? req.body.folder : "";
  var tags = (req.body.tags) ? req.body.tags : "";
  var url = (req.body.url) ? req.body.url : "";

  res.setHeader('Content-Type', 'application/json');
  if ( (url.length > 0) && (title.length > 0) ) {
    var imageName = url.replace(/.*?:\/\/(www)?/g, "").replace(/[^a-zA-Z0-9]/g, "").substring(0, 22)+ Math.random().toString(36).substring(7) +'.jpg';
    webshot(url, "images/"+imageName, webshotOptions, function(error) {
      if (error) {
        res.end(JSON.stringify({ status: 'failed', reason: 'Unable to render page image.' }, null, 3));
      } else {
        lwip.open("images/"+imageName, function(error1, image) {
          if (error1) {
            res.end(JSON.stringify({ status: 'failed', reason: 'Unable to open rendered image.' }, null, 3));
          } else {
            image.resize(730, 450, "lanczos", function(error2, tumbnail) {
              if (error2) {
                res.end(JSON.stringify({ status: 'failed', reason: 'Unable to resize image.' }, null, 3));
              } else {
                tumbnail.writeFile("images/"+imageName, function(error3) {
                  if (error3) {
                    res.end(JSON.stringify({ status: 'failed', reason: 'Unable to write tumbnail image file.' }, null, 3));
                  } else {
                    childRef = bookmarkbase.child("bookmarks").push( {"title":title, "url":url, "imageurl":imageName, "folder":folder, "tags":tags}, function(error4) {
                      if (error4) {
                        res.end(JSON.stringify({ status: 'failed', reason: 'Unable to push firebase data.' }, null, 3));
                      } else {
                        res.end(JSON.stringify({ status: 'success', key: childRef.key(), imageurl: imageName, url: url, title: title, folder: folder, tags: tags }, null, 3));
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  } else {
    res.end(JSON.stringify({ status: 'failed', reason: 'Invalid bookmark data provided.' }, null, 3));
  }
});


var server = app.listen(8000, function() {
  console.log("> Bookmarker server started on port: %d", server.address().port);
  bookmarkbase.authWithCustomToken(AUTH_TOKEN, function(error, authData) {
    if (error) {
      console.log("> Error: Firebase authentication failed.");
      console.log(error);
      console.log("> Closing bookmarker server due to database failure.")
      server.close();
    }
  });
});



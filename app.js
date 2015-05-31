var lwip = require("lwip");
var webshot = require('webshot');
var express = require('express');
var bodyParser = require('body-parser')
var ECT = require('ect');
var app = express();

app.use(bodyParser.json());
app.use(express.static('static'));
app.use(express.static('images'));

var ectRenderer = ECT({ watch: true, root: __dirname + '/views', ext : '.ect' });
app.set('view engine', 'ect');
app.engine('ect', ectRenderer.render);

var options = {
  windowSize: { width: 1650, height: 1050 },
  shotSize: { width: 'window', height: 'window' },
  userAgent: "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36"
}

app.get('/', function (req, res) {
  res.render('index');
});

app.post('/api/save', function (req, res) {
  var url = req.body.url;
  var imageName = url.replace(/.*?:\/\/(www)?/g, "").replace(/[^a-zA-Z0-9]/g, "").substring(0, 22)+ Math.random().toString(36).substring(7) +'.jpg';
  res.setHeader('Content-Type', 'application/json');

  webshot(url, "images/"+imageName, options, function(error) {
    if (error) {
      res.end(JSON.stringify({ status: 'failed', url: '', reason: 'Unable to render page image.' }, null, 3));
    } else {
      lwip.open("images/"+imageName, function(error1, image) {
        if (error1) {
          res.end(JSON.stringify({ status: 'failed', url: '', reason: 'Unable to open rendered image.' }, null, 3));
        } else {
          image.resize(730, 450, "lanczos", function(error2, tumbnail) {
            if (error2) {
              res.end(JSON.stringify({ status: 'failed', url: '', reason: 'Unable to resize image.' }, null, 3));
            } else {
              tumbnail.writeFile("images/"+imageName, function(error3) {
                if (error3) {
                  res.end(JSON.stringify({ status: 'failed', url: '', reason: 'Unable to write tumbnail image file.' }, null, 3));
                } else {
                  res.end(JSON.stringify({ status: 'success', url: "images/"+imageName, reason: 'success.' }, null, 3));
                }
              });
            }
          });
        }
      });
    }
  });

});



var server = app.listen(8000, function() {
  console.log("Server started on port: %d", server.address().port);
});





var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var GitHubApi = require('github');
var async = require('async');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// setup get and posts

app.post('/getMilestones', function(req, res) {

  console.log(req.body);

  var splitURLs = req.body.urls.split('\r\n');

  // remove empty URLs (extra carriage returns)
  Array.prototype.clean = function(deleteValue) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] == deleteValue) {
        this.splice(i, 1);
        i--;
      }
    }
    return this;
  };
  splitURLs.clean('');

  var responseObj = {};

  async.each(splitURLs, function(url, callback) {


      var user = url.split('/')[3];
      var repo = url.split('/')[4];

      console.log('user: ' + user);
      console.log('repo: ' + repo);

      var github = new GitHubApi({
          // required
          version: "3.0.0",
          // optional
          debug: true,
          protocol: "https",
          timeout: 5000
      });

      github.issues.getAllMilestones({
        user: user,
        repo: repo,
        state: 'open'
      }, function(err, result) {

        if (err) {

          callback('error getting this repo: ' + user + '/' + repo + '. please try again.');

        } else {

          console.log('found ' + result.length + ' results');

          var responseArray = [];

          for (var i = 0; i < result.length; i++) {
            console.log('result i closed at ', result[i]);
            responseArray.push({
              title: result[i].title,
              closed_at: result[i].due_on.split('T')[0]
            })
          }

          responseArray.sort(function(b, a) {
            return new Date(b.closed_at) - new Date(a.closed_at);
          });

          responseObj[user + '/' + repo] = responseArray;


          callback();


        }

      });




  }, function(err) {

    if( err ) {
      // One of the iterations produced an error.
      // All processing will now stop.
      console.log('A file failed to process');
      res.send(err);
    } else {
      console.log('All files have been processed successfully');
      res.send(JSON.stringify(responseObj));
    }

  });


});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

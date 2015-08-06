var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var GitHubApi = require('github');

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

  var github = new GitHubApi({
      // required
      version: "3.0.0",
      // optional
      debug: true,
      protocol: "https",
      timeout: 5000
  });

  github.issues.getAllMilestones({
    user: req.body.user,
    repo: req.body.repo,
    state: 'closed'
  }, function(err, result) {
    console.log('found ' + result.length + ' results');

    var responseArray = [];
    for (var i = 0; i < result.length; i++) {
      responseArray.push({
        title: result[i].title,
        closed_at: result[i].closed_at
      })
    }

    responseArray.sort(function(a, b) {
      return new Date(b.closed_at) - new Date(a.closed_at);
    })

    res.send(JSON.stringify(responseArray));
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

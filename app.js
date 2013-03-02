/**
 * Module dependencies.
 */

var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , redis = require('redis')
  , client = redis.createClient()
  , crypto = require('crypto')
  , path = require('path');

client.on("error", function (err) {
  console.log("Redis Error: " + err);
});

client.del('tokens')

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function (req, res) {
  client.smembers('tokens', function (e, replies) {
    res.render('index', {tokens: replies})
  })
})

function addToken(key, callback) {
  crypto.randomBytes(2, function(ex, buf) {
    var token = buf.toString('hex');

    client.sadd(key, token, function (e, reply) {
      if (reply == 1) {
        callback(token)
      } else {
        addToken(key, callback)
      }
    })
  });
}

app.get('/start', function (req, res) {
  addToken('tokens', function (token) {
    res.redirect('/master/' + token)
  })
})

app.get('/master/:token', function (req, res) {
  res.render('master', { token: req.params['token'] })
})

app.get('/session/:token', function (req, res) {
  res.render('session', { token: req.params['token'] })
})

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


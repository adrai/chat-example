var crypto = require('crypto'),
  fs = require('fs'),
  http = require('http'),
  socketIO = require('socket.io');

var gc = (require('gc-stats'))();
var usage = require('usage');

function generateKey() {
  var sha = crypto.createHash('sha256');
  sha.update(Math.random().toString());
  return sha.digest('hex');
}

process.env.PORT = process.env.PORT || 3000;

var memoryLeak = {};

var app = http.createServer(function (req, res) {
  // To Write a Cookie
  res.writeHead(200, {
    'Set-Cookie': 'JSESSIONID=' + generateKey()
  });

  for (var i = 0; i < 1000; i++) {
    memoryLeak[generateKey()] = generateKey();
  }

  res.statusCode = '200';
  res.end(fs.readFileSync(__dirname + '/index.html'));
});

var io = socketIO(app);

var pid = process.pid;

io.sockets.use(function (socket, next) {
  console.log(process.env.PORT + ': headers: ');
  console.log(socket.handshake.headers);
  next();
});

io.on('connection', function(socket) {
  var id = generateKey();

  gc.on('stats', function (info) {
    console.log(JSON.stringify(info, null, 2));
    usage.lookup(pid, function(err, result) {
      console.log(JSON.stringify(result, null, 2));
      io.emit('chat message', JSON.stringify(result, null, 2));
    });
  });

  console.log('connected');
  socket.on('chat message', function(msg){
    console.log(msg)

    if (msg === 'leak') {
      io.emit('chat message', 'ok... I will leak');
      for (var i = 0; i < 10000; i++) {
        memoryLeak[id] = memoryLeak[id] || {};
        memoryLeak[id][generateKey()] = generateKey();
      }
      return;
    }

    if (msg === 'clear' || msg === 'clean') {
      io.emit('chat message', 'ok... I will clean the leak');
      delete memoryLeak[id];
      return;
    }

    io.emit('chat message', msg);
  });
  socket.on('disconnect', function (reason) {
    console.log('socket disconnected: ' + reason);
  });
});

app.listen(process.env.PORT, function(){
  console.log('SERVER started on: ' + process.env.PORT);
});

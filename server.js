var crypto = require('crypto'),
  fs = require('fs'),
  http = require('http'),
  socketIO = require('socket.io');

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

io.sockets.use(function (socket, next) {
  console.log(process.env.PORT + ': headers: ');
  console.log(socket.handshake.headers);
  next();
});

io.on('connection', function(socket){
  console.log('connected');
  socket.on('chat message', function(msg){
    console.log(process.env.PORT);
    console.log(msg)
    io.emit('chat message', msg);
  });
  socket.on('disconnect', function (reason) {
    console.log(process.env.PORT);
    console.log('socket disconnected: ' + reason);
  });
});

app.listen(process.env.PORT, function(){
  console.log('SERVER started on: ' + process.env.PORT);
});

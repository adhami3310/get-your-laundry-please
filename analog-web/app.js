var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort("/dev/ttyACM0", {
  baudrate: 57600
});

var lastReceived = "nothing";

serialPort.on("open", function () {
  console.log('open');
  serialPort.on('data', function(data) {
    console.log('data received: ' + data);
    lastReceived = data;
  });  
});

var app = require('express')();

app.get('/', function(req,res) {
  res.send('received: '+lastReceived);
});

app.listen(3000);

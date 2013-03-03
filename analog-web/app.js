var SerialPort = require("serialport").SerialPort;
var util = require('util');
console.log("starting new");
var serialPort = new SerialPort("/dev/ttyACM0", {
  baudrate: 9600
});

var lastReceived = "nothing";
var buf = "";

console.log("starting open");

serialPort.on("open", function () {
  console.log('opened');
  serialPort.on('data', function(data) {
    //util.print(data);
    buf += data;
    var splot = buf.split("\n");
    if(splot.length == 1) return;
    lastReceived = splot[0];
    console.log(lastReceived);
    buf = splot[1];
  });
});


var express = require('express');
var app = express();

app.configure(function() {
  app.set('port', 3000);
  app.use(express.bodyParser());
  app.use(express.static(__dirname+'/public'));
});



app.get('/rawdata', function(req,res) {
  res.send(lastReceived);
});

app.listen(3000);

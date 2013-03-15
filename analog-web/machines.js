var SerialPort = require("serialport").SerialPort;
var events = require('events');
var util = require('util');
var _ = require('underscore');

function Machines(count) {
  this.serialPort = null;
  this.lastReceived = "";
  this.buf = "";
  this.lastEvent = Date.now();
  this.onStatus = [];
  this.transitionings = [];
  for(var i = 0; i < count; i++) {
    this.onStatus.push(false);
    this.transitionings.push(false);
  }
  this.transDelayDown = 77000;
  this.transDelayUp = 1700;
  this.voltageCutoff = 0.45;
}

util.inherits(Machines, events.EventEmitter);

Machines.prototype.createMachines = function(path, br) {
  this.serialPort = new SerialPort(path, {baudrate: br});
  console.log("serialPort: "+this.serialPort);
  var self = this; //stupid
  this.serialPort.on("open", function () {
    console.log("opened");
    self.serialPort.on('data', function(data) {
      self.onData(data);
    });
  });
};

Machines.prototype.onData = function(data) {
  this.buf += data;
  var splot = this.buf.split("\n");
  if(splot.length == 1) return;
  this.lastReceived = splot[0];
  this.buf = splot[1];
  if(!this.lastReceived) return;
  var vals = _.map(this.lastReceived.split(" "), parseFloat);
  this.emit("rawdata", vals);
  for(var i = 0; i < this.onStatus.length && i < vals.length; i++) {
  if( this.onStatus[i] ) {
    if(vals[i] > this.voltageCutoff) {
      this.transitionings[i] = false;
      return; //expected, ignore
    }

    if(!this.transitionings[i]) {
      this.transitionings[i] = true;
      this.lastEvent = Date.now();
    }
    //transition into off
    if(Date.now() - this.lastEvent > this.transDelayDown) {
      this.onStatus[i] = false;
      this.emit("status", this.getStatus());
    }
  } else {
    if(vals[i] < this.voltageCutoff) {
      this.transitionings[i] = false;
      return; //expected, ignore
    }
    if(!this.transitionings[i]) {
      this.transitionings[i] = true;
      this.lastEvent = Date.now();
    }
    //transition to on
    if(Date.now() - this.lastEvent > this.transDelayUp) {
      this.onStatus[i] = true;
      this.emit("status", this.getStatus());
    }
  }
  }
};

Machines.prototype.getStatus = function() {
  return {onStatus: this.onStatus, unique: Math.random()};
};

module.exports = Machines;

var SerialPort = require("serialport").SerialPort;
var events = require('events');
var util = require('util');
var _ = require('underscore');
var fs = require('fs');

function Machines(stati) {
  var count = stati.length;
  this.serialPort = null;
  this.lastReceived = "";
  this.buf = "";
  this.onStatus = stati; // status of each machine: 0=off, 1=on, 2=broken
  this.lastHighs = [];
  this.transitions = []; //when each machine last turned on or off
  for(var i = 0; i < count; i++) {
    //this.onStatus.push(0);
    this.transitions.push(Date.now());
    this.lastHighs.push(Date.now());
  }
  this.onThreshold = 2.0;
  this.offThreshold = 1.5;
  this.ludicrousCurrent = 40;  // ignore freak measurement errors
  this.maxHighInterval = 60000;
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
  if(splot.length === 1) return; //return until a full line has been received

  this.lastReceived = splot[0];
  this.buf = splot[1]; //save overfill

  if(!this.lastReceived) return; //if nothing has been received, return

  var vals = _.map(this.lastReceived.split(" "), parseFloat); //get currents

  switch (vals.length) {
  case 3:
    logfile = "/var/log/laundry/washers.log";
    break;
  case 4:
    logfile = "/var/log/laundry/dryers.log";
    break;
  default:
    logfile = "/dev/null";
    break;
  }
  fs.appendFile(logfile, Date.now()+": ")
  this.emit("rawdata", vals); //emit current values to the application

  //for every machine being tracked
  for(var i = 0; i < vals.length && i < this.onStatus.length; i++) {
    if (isNaN(vals[i]) || vals[i] > this.ludicrousCurrent)
      continue;
    if (vals[i] > this.offThreshold) {
      if (this.onStatus[i] === 0 && vals[i] > this.onThreshold) {
	this.onStatus[i] = 1;
	this.transitions[i] = Date.now();
        this.emit("status", this.getStatus());
      }
      this.lastHighs[i] = Date.now();
    } else if (this.onStatus[i] === 1
	       && Date.now() - this.lastHighs[i] > this.maxHighInterval) {
      this.onStatus[i] = 0;
      this.transitions[i] = Date.now();
      this.emit("status", this.getStatus());
    }
    fs.appendFile(logfile, (vals[i].toFixed(2)+","
			    +this.onStatus[i]+","));
  }
  fs.appendFile(logfile, "\n");
};

Machines.prototype.getStatus = function() {
  console.log("getting status!");
  return {
    onStatus: this.onStatus,
    unique: Math.random(),
    transitions: this.transitions
  };
};

module.exports = Machines;

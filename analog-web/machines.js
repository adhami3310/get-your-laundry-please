
var SerialPort = require("serialport");
var events = require('events');
var util = require('util');
var _ = require('underscore');
var fs = require('fs');

function Machines(count) {
  this.serialPort = null;
  this.lastReceived = "";
  this.buf = "";
  this.onStatus = []; // status of each machine: 0=off, 1=on, 2=broken
  this.lastHighs = [];
  this.transitions = []; //when each machine last turned on or off
  for(var i = 0; i < count; i++) {
    this.onStatus.push(0);
    this.transitions.push(Date.now());
    this.lastHighs.push(Date.now());
  }
  this.onThreshold = 2.0;
  this.offThreshold = 2.0;
  this.ludicrousCurrent = 40;  // ignore freak measurement errors
  this.maxHighInterval = 60000;
}

util.inherits(Machines, events.EventEmitter);

var Readline = require('@serialport/parser-readline');

Machines.prototype.createMachines = function(path, br) {
  this.serialPort = new SerialPort(path, {baudRate: br});
  var parser = this.serialPort.pipe(new Readline({ delimiter: '\n'}));
  console.log("serialPort: "+this.serialPort);
  this.serialPort.on("open", () => {
    console.log("opened");
  });
  var self = this;
  parser.on('data', data =>{
    self.onData(data);
  });
};

console.log("wanted machines");

Machines.prototype.onData = function(data) {
  this.buf = data+"\n";
  var splot = this.buf.split("\n");
  if(splot.length === 1) return; //return until a full line has been received

  this.lastReceived = splot[0];
  this.buf = splot[1]; //save overfill

  console.log("what does the machine say");
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
//  fs.appendFile(logfile, Date.now()+": ")
  console.log(splot[0]);
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
//    console.log(vals[i].toFixed(2)+","+this.onStatus[i]+",");
//    fs.appendFile(logfile, (vals[i].toFixed(2)+","
//			    +this.onStatus[i]+","));
  }
//  fs.appendFile(logfile, "\n");
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

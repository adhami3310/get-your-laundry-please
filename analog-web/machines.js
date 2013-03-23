var SerialPort = require("serialport").SerialPort;
var events = require('events');
var util = require('util');
var _ = require('underscore');

function Machines(count) {
  this.serialPort = null;
  this.lastReceived = "";
  this.buf = "";
  this.lastEvents = []; //when the last event (alteration in the current) happened
  this.onStatus = []; //whether each machine is on
  this.transitionings = []; //whether each machine is in a state of transition
  this.transitions = []; //when each machine last turned on or off
  for(var i = 0; i < count; i++) {
    this.onStatus.push(false);
    this.transitionings.push(false);
    this.transitions.push(new Date());
    this.lastEvents.push(new Date());
  }
  this.transDelayDown = 77000;
  this.transDelayUp = 1700;
  this.currentCutoff = 0.45;
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
  if(splot.length == 1) return; //return until a full line has been received

  this.lastReceived = splot[0];
  this.buf = splot[1]; //save overfill

  if(!this.lastReceived) return; //if nothing has been received, return

  var vals = _.map(this.lastReceived.split(" "), parseFloat); //get currents
  this.emit("rawdata", vals); //emit current values to the application

  //for every machine being tracked
  for(var i = 0; i < this.onStatus.length && i < vals.length; i++) {
    //if it is on
    if( this.onStatus[i] ) {
      //if current is high it's expected (the machine is on)
      if(vals[i] > this.currentCutoff) {
        this.transitionings[i] = false;
        return; //expected, ignore
      }
      //current must be low
      if(!this.transitionings[i]) {
        this.transitionings[i] = true;
        this.lastEvents[i] = Date.now();
      }
      //transition into off, current has been low for transDelayDown
      if(Date.now() - this.lastEvents[i] > this.transDelayDown) {
        this.onStatus[i] = false;
        this.transitions[i] = Date.now();
        this.emit("status", this.getStatus());
      }
    } else {
      //the laundry is low
      //current is low, it's expected
      if(vals[i] < this.currentCutoff) {
        this.transitionings[i] = false;
        return; //expected, ignore
      }
      if(!this.transitionings[i]) {
        this.transitionings[i] = true;
        this.lastEvents[i] = Date.now();
      }
      //transition to on
      if(Date.now() - this.lastEvents[i] > this.transDelayUp) {
        this.onStatus[i] = true;
        this.transitions[i] = Date.now();
        this.emit("status", this.getStatus());
      }
    }
  }
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

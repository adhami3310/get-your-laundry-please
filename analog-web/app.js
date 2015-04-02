var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var _ = require('underscore');
var zephyr = require('zephyr');
var auth = require('./auth.js');

zephyr.initialize();
zephyr.openPort();

io.configure(function(){
  io.set('log level', 1);
});
var nodemailer = require("nodemailer");
var smtpTransport = nodemailer.createTransport("SMTP",{
  service: "Gmail",
  auth: auth.login
});
var Machines = require('./machines.js');
var washers = new Machines(3);
washers.createMachines("/dev/ttyUSB1", 9600);
var dryers = new Machines(4);
dryers.createMachines("/dev/ttyUSB0", 9600);
/* USB1 and USB0 were originally the other way around, but looking at the
 * data coming in on the serial ports, it's clear that the washers are on USB1
 * and the dryers are on USB0 */

app.configure(function() {
  app.set('port', 80);
  app.use(express.bodyParser());
  app.use(express.static(__dirname+'/public'));
});



/*app.get('/rawdata', function(req,res) {
  res.send(machines.lastReceived); //old old
});*/
var subscribers = {
};

for (var i = 0; i < 3; ++i)
  subscribers["washer"+i] = [];
for (var i = 0; i < 4; ++i)
  subscribers["dryer"+i] = [];

subscribers["washerAny"] = [];
subscribers["dryerAny"] = [];

io.sockets.on("connection", function(socket) {
  socket.on("subscribe", function(data) {
    console.log("subscribe: ");
    console.log(data);
    data.contact = data.contact.trim();
    if (data.contact === '')
      return;
    if (data.target === "test") {
      notify(data.contact, "Test message");
      return;
    }
    if(!subscribers.hasOwnProperty(data.target)) 
      return;
    var queue = subscribers[data.target];
    if(queue.length < 25 || _.contains(queue, data.contact)) {
      if (!_.contains(queue, data.contact))
	queue.push(data.contact);
      socket.emit("subscribe", true);
    } else {
      socket.emit("subscribe", false);
    }
    console.log(subscribers);
  });
  socket.emit("washers", washers.getStatus());
  socket.emit("dryers", dryers.getStatus());
});


function sendMail(email, subject) {
  smtpTransport.sendMail({
      from: "Laundry Server <random.laundry.empress@gmail.com>", // sender address
      to: email, // list of receivers
      subject: "[Laundry] "+subject,
      text: "resistance is futile" // plaintext body
  }, function(error, response) {
    if(error){
      console.log(error);
    } else {
      console.log("Message sent: " + response.message);
    }
  });
}

function sendZephyr(user, message) {
  var notice = zephyr.sendNotice({
    port: 1,
    recipient: user+'@ATHENA.MIT.EDU',
    sender: 'random-laundry-empress',
    body: [
      'Her Imperious Laundrycension',
      message
    ]
  }, zephyr.ZNOAUTH, function(err) {
    if (err) {
      console.error('Failed to send notice', err);
      return;
    }
    console.log('got HMACK');
  }).on('servack', function(err, msg) {
    if (err) {
      console.error('got SERVNAK', err);
      return;
    }
    console.log('got SERVACK', msg);
  });
  console.log('uid', notice.uid);
}

var providers = require('./public/providers.js').providers;
function sendText(number, message) {
  _.each(providers, function(provider) {
    var email = provider.email.replace('%s', number);
    smtpTransport.sendMail({
      from: "random.laundry.empress@gmail.com", // sender address
      to: email, // list of receivers
      subject: "Text",
      text: message // plaintext body
    }, function(error, response) {
      if(error){
	console.log(error);
      } else {
	console.log("Message sent: " + response.message);
      }
    });
  });
}

function notify(target, message) {
  var medium = null;
  var send = null;
  if (target.match(/^\d{10}$/)) { // it's a phone number
    medium = "text";
    send = sendText;
  } else if (target.indexOf("@") !== -1) {  // it's an email, I guess?
    medium = "email";
    send = sendMail;
  } else {
    medium = "zephyr";
    send = sendZephyr;
  }
  console.log("sending "+medium+" to "+target);
  send(target, message);
}
  
function makeCheckFunction(type) {
  return function(onStati) {
    //todo wildcards
    for(var i = 0; i < onStati.length; i++) {
      var name = type+i;
      var any = type+"Any";
      if(onStati[i] > 0) {
        console.log(name+"machine is "+(onStati[i] === 1 ? "on" : "out of order"));
        continue;
      }
      if(!subscribers.hasOwnProperty(name)) continue;
      var queue = subscribers[name].concat(subscribers[any]);
      if (queue.length > 0)
	      console.log("sending notifications to "+queue);
      //send emails and stuff
      for(var j = 0; j < queue.length; j++) {
	      notify(queue[j], type+" #"+i+" is done");
      }
      subscribers[name] = []; //their laundry is done --> no longer interested
      subscribers[any] = [];
    }
  };
}
washers.on("status", function(data) {
  io.sockets.emit("washers", data);
  //io.sockets.in("status").emit("washers", data);
  makeCheckFunction("washer")(data.onStatus);
});
dryers.on("status", function(data) {
  io.sockets.emit("dryers", data);
  //io.sockets.in("status").emit("dryers", data);
  makeCheckFunction("dryer")(data.onStatus);
});

washers.on("rawdata", function(data) {
  //console.log("rawdata: "+data);
  io.sockets.in("rawdata").volatile.emit("washers_raw", data);
  //io.sockets.in("rawdata").volatile.emit("washers_raw", data);
});
dryers.on("rawdata", function(data) {
  io.sockets.in("rawdata").volatile.emit("dryers_raw", data);
  //io.sockets.in("rawdata").volatile.emit("dryers_raw", data);
});
server.listen(80);

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var _ = require('underscore');

io.configure(function(){
  io.set('log level', 1);
});
var nodemailer = require("nodemailer");
var smtpTransport = nodemailer.createTransport("SMTP",{
  service: "Gmail",
  auth: {
    user: "random.laundry.empress@gmail.com",
    pass: "ozoksocket"
  }
});
var Machines = require('./machines.js');
var washers = new Machines(3);
washers.createMachines("/dev/ttyUSB0", 9600);
var dryers = new Machines(4);
dryers.createMachines("/dev/ttyUSB1", 9600);

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

io.sockets.on("connection", function(socket) {
  //socket.join("rawdata");
  //socket.join("washers_raw");
  //socket.join("dryers_raw");
  socket.on("subscribe", function(data) {
    console.log("subscribe: ");
    console.log(data);
    if(!subscribers.hasOwnProperty(data.target)) {

      //this is terrible
      subscribers[data.target] = [];
    }
    var queue = subscribers[data.target];
    if(queue.length < 25) {
      queue.push(data.email);
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

function makeCheckFunction(type) {
  return function(onStati) {
    //todo wildcards
    for(var i = 0; i < onStati.length; i++) {
      var name = type+i;
      if(onStati[i]) {
        console.log(name+"machine is on");
        continue;
      }
      if(!subscribers.hasOwnProperty(name)) continue;
      var queue = subscribers[name];
      console.log("sending mail to "+queue);
      //send emails and stuff
      for(var j = 0; j < queue.length; j++) {
        sendMail(queue[j], type+" #"+i+" is done");
        subscribers[name]=[] //their laundry is done --> no longer interested
      }
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

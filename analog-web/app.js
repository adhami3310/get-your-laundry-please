var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var _ = require('underscore');
_.each(["hey", "hey"], console.log);

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
  app.set('port', 3000);
  app.use(express.bodyParser());
  app.use(express.static(__dirname+'/public'));
});



/*app.get('/rawdata', function(req,res) {
  res.send(machines.lastReceived); //old old
});*/
var subscribers = {
  "washers": ["hobinjk@mit.edu"]
};

io.sockets.on("connection", function(socket) {
  //socket.join("rawdata");
  //socket.join("washers_raw");
  //socket.join("dryers_raw");
  socket.on("subscribe", function(data) {
    console.log("subscribe: "+data);
    if(!subscribers.hasOwnProperty(data.target)) {
      socket.emit("subscribe", false);
      return;
    }
    var queue = subscribers[data.target];
    if(queue.length < 5) {
      queue.push(data.subscriber);
      socket.emit("subscribe", true);
    } else {
      socket.emit("subscribe", false);
    }
  });
  //socket.emit("status", machines.getStatus());
});

washers.on("status", function(data) {
  io.sockets.emit("washers", data);
  //io.sockets.in("status").emit("washers", data);
  if(data.data[0]) return; //machine is on
  //send emails and stuff
  var queue = subscribers["washer"];

  _.each(queue, function(email) {
    smtpTransport.sendMail({
        from: "Laundry Server <random.laundry.empress@gmail.com>", // sender address
        to: email, // list of receivers
        subject: "Machine is free", // Subject line
        text: "resistance is futile ("+data["unique"]+", "+queue.length+")" // plaintext body
    }, function(error, response) {
      if(error){
        console.log(error);
      } else {
        console.log("Message sent: " + response.message);
      }
    });
  });
  queue = ["hobinjk@mit.edu"];
});
dryers.on("status", function(data) {
  io.sockets.emit("dryers", data);
  //io.sockets.in("status").emit("dryers", data);
});

washers.on("rawdata", function(data) {
  //console.log("rawdata: "+data);
  io.sockets.volatile.emit("washers_raw", data);
  //io.sockets.in("rawdata").volatile.emit("washers_raw", data);
});
dryers.on("rawdata", function(data) {
  io.sockets.volatile.emit("dryers_raw", data);
  //io.sockets.in("rawdata").volatile.emit("dryers_raw", data);
});
server.listen(3000);

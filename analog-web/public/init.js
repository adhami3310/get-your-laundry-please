var socket = io.connect("http://laundry.mit.edu");

socket.on("washers", function(data) {
  console.log("washer status: ");
  console.log(data);
  updateStati("washer", data);
});

socket.on("dryers", function(data) {
  console.log("dryer status: ");
  console.log(data);
  updateStati("dryer", data);
});

var lastTransitions = {
  washer: [],
  dryer: []
};

var lastOnStati = {
  washer: [],
  dryer: []
};

function useTransitionValue(type) {
  return function(date,id) {
    var el = $("#"+type+id+" > .cell");
    var tel = el.children(".time")
    var date = new Date(date);
    var diff = Math.round((Date.now() - date.getTime())/60000.0);
    tel.text(diff);
  }
}

function heartbeat() {
  _.each(lastTransitions.washer, useTransitionValue("washer"));
  _.each(lastTransitions.dryer,  useTransitionValue("dryer"));
}

setInterval(heartbeat, 500);

function updateStati(prefix, data) {
  lastTransitions[prefix] = data.transitions;
  lastOnStati[prefix] = data.onStatus;
  for(var i = 0; i < data.onStatus.length; i++) {
    var el = $("#"+prefix+i);
    var clr = data.onStatus[i] ? "green" : "red";
    var onoff = el.children(".cell").children(".onoff");
    var txt = data.onStatus[i] ? "On for" : "Off for";
    el.css("border-color", clr);
    onoff.text(txt);
    //updateFunction(prefix)(data.transitions[i], i);
  }
}

function enableCharts() {
  var washers = [
    new Chart(),
    new Chart(),
    new Chart()
  ];
  var dryers = [
    new Chart(),
    new Chart(),
    new Chart(),
    new Chart()
  ];

  socket.on("washers_raw", function(data) {
    for(var i = 0; i < data.length; i++)
      washers[i].tick(data[i]);
  });
  socket.on("dryers_raw", function(data) {
    for(var i = 0; i < data.length; i++)
      dryers[i].tick(data[i]);
  });

}

$("#email").keydown(function(evt) {
  if(evt.which === 13) {
    evt.preventDefault();
    var email = $("#email").val();
    socket.emit("subscribe", {
      email: email.trim(),
      target: subscribeTarget
    });
    $("#email").val("");
  }
});

var subscribeTarget;

function unsetSubscribeTarget() {
  setSubscribeTarget(null);
  subscribeTarget = null;
}

var humanReadables = {
  "washer0": "washer #0",
  "washer1": "washer #1",
  "washer2": "washer #2",
  "dryer0":  "dryer #0",
  "dryer1":  "dryer #1",
  "dryer2":  "dryer #2",
  "dryer3":  "dryer #3",
  null: "_______"
};


function setSubscribeTarget(id) {
  $("#machine-name").text(humanReadables[id]);
  subscribeTarget = id;
}

$(".status").mouseenter(function(evt) {
  var id = evt.target.id;
  if(id.substr(0,6) === "washer") {
    var idx = parseInt(id.substr(6));
    if(lastOnStati["washer"][idx])
      setSubscribeTarget(id);
  } else if(id.substr(0,5) === "dryer") {
    var idx = parseInt(id.substr(5));
    if(lastOnStati["dryer"][idx])
      setSubscribeTarget(id);
  }
});
$(".washers").mouseenter(function(evt) {
  setSubscribeTarget("any washer");
});
$(".dryers").mouseenter(function(evt) {
  setSubscribeTarget("any dryer");
});

$(".status").mouseleave(function(evt) {
  console.log(evt.target);
});

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

var statusColor = ["green", "red", "black"]
var statusText = ["Off for", "On for", "Out of order"]

function updateStati(prefix, data) {
  lastTransitions[prefix] = data.transitions;
  lastOnStati[prefix] = data.onStatus;
  for(var i = 0; i < data.onStatus.length; i++) {
    var el = $("#"+prefix+i);
    var clr = statusColor[data.onStatus[i]];
    var onoff = el.children(".cell").children(".onoff");
    var time = el.children(".cell").children(".time");
    var label = el.children(".cell").children(".label");
    var txt = statusText[data.onStatus[i]];
    el.css("border-color", clr);
    onoff.text(txt);
    if (data.onStatus[i] === 2) {
      time.css("display", "none");
      label.css("display", "none");
    }
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

function parseContact(cont) {
  cont = cont.trim();
  if (cont === "" || cont == null)
    return { contact: "", medium: "" };

  var medium;
  var cell;
  if (cell = cont.match(/^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/)) {
    medium = "Text";
    cont = cell[1] + cell[2] + cell[3];
  }
  else if (cont.match(/^[^ ]+@[^ ]+$/))
    medium = "Email";
  else
    medium = "Zephyr";

  return { contact: cont, medium: medium };
}

$("#contactInfo").on("change keydown keyup", function(evt) {
  if (evt.which === 13) {
    evt.preventDefault();
  }
  document.cookie = "contact=" + escape($("#contactInfo").val());
  $("#confirm").text("");
  parsed = parseContact($("#contactInfo").val());
  if (parsed.contact !== "")
    $("#contact").text(parsed.medium+": "+parsed.contact);
  else
    $("#contact").text("Invalid contact");
});

contact = document.cookie.match ( '(^|;) *contact=([^;]*)(;|$)' );
if (contact) {
  $("#contactInfo").val(unescape(contact[2]));
  $("#contactInfo").trigger("change");
}


var humanReadables = {
  "washer0": "washer #0",
  "washer1": "washer #1",
  "washer2": "washer #2",
  "washerAny": "any washer",
  "dryer0":  "dryer #0",
  "dryer1":  "dryer #1",
  "dryer2":  "dryer #2",
  "dryer3":  "dryer #3",
  "dryerAny": "any dryer",
};


$(".notify, .notify *").on("click", function(evt) {
  $("#confirm").text("");

  var id = $(evt.target).closest(".notify")[0].id;

  var match;
  if (match = id.match(/(washer|dryer)Any/)) {
    if (_.every(lastOnStati[match[1]], _.negate(_.partial(_.equals, 1)))) {
      $("#confirm").css("black");
      $("#confirm").text("No "+match[1]+"s are currently running.");
      return;
    }
  }
  
  if(id.substr(0,6) === "washer") {
    var idx = parseInt(id.substr(6));
    if(lastOnStati["washer"][idx] !== 1)
      id = null;
  } else if(id.substr(0,5) === "dryer") {
    var idx = parseInt(id.substr(5));
    if(lastOnStati["dryer"][idx] !== 1)
      id = null;
  }
  
  if(id == null) {
    $("#confirm").css("color", "red");
    $("#confirm").text("Please select a running machine.");
    return;
  }

  var parsed = parseContact($("#contactInfo").val());

  if (parsed.contact === '') {
    $("#confirm").css("color", "red");
    $("#confirm").text("Please enter contact information.");
    return;
  }

  socket.emit("subscribe", {
    contact: parsed.contact,
    target: id,
  });

  if (id === "test") {
    $("#confirm").css("color", "black");
    $("#confirm").text("Sending test "+parsed.medium.toLowerCase()+" to "+parsed.contact);
  } else {
    socket.on("subscribe", function (success) {
      if (success) {
        $("#confirm").css("color", "green");
        $("#confirm").text(parsed.medium+" will be sent to "+parsed.contact+" when "
			   +humanReadables[id]+" finishes.");
      } else {
        $("#confirm").css("color", "red");
        $("#confirm").text("Notification queue for "+humanReadables[id]
			   +" is full.");
      }
    });
  }
});

$("#test").on("click", function() {
  parsed = parseContact($("#contactInfo").val());
  if (parsed.contact !== "") {
    socket.emit("subscribe", {
      contact: parsed.contact,
      target: "test"
    });
  } else {
    $("#confirm").css("color", "red");
    $("#confirm").text("Please enter contact information.");
  }
});

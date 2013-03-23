var socket = io.connect("http://laundry.mit.edu");
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

function updateStati(prefix, data) {
  for(var i = 0; i < data.onStatus.length; i++) {
    var el = $("#"+prefix+i);
    var clr = data.onStatus[i] ? "green" : "red";
    el.css("background-color", clr);
    var diff = Math.floor((Date.now() - data.transitions[i])/60000);
    el.text(diff);
  }
}
socket.on("washers_raw", function(data) {
  for(var i = 0; i < data.length; i++)
    washers[i].tick(data[i]);
});
socket.on("dryers_raw", function(data) {
  for(var i = 0; i < data.length; i++)
    dryers[i].tick(data[i]);
});


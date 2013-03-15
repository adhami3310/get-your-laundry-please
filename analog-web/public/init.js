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
  console.log("status: ");
  console.log(data);
  $("#stati").append((data.data[0] ? "on" : "off")+": "+new Date()+"\n");
});
socket.on("washers_raw", function(data) {
  for(var i = 0; i < data.length; i++)
    washers[i].tick(data[i]);
});
socket.on("dryers_raw", function(data) {
  for(var i = 0; i < data.length; i++)
    dryers[i].tick(data[i]);
});


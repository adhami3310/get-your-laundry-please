
var margin = {top: 6, right: 0, bottom: 16, left: 40};
var width = 900 - margin.right;
var height = 200 - margin.top - margin.bottom;

var n = 243,
    duration = 500,
    now = new Date(Date.now() - duration),
    count = 0,
    data = d3.range(n).map(function() { return 0; });

var x = d3.scale.linear()
    .domain([0,n-1])
    .range([0,width]);
  //time.scale()
    //.domain([now - (n - 2) * duration, now - duration])
    //.range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var line = d3.svg.line()
    .interpolate("linear")
    .x(function(d,i) { return x(i); })
    .y(function(d,i) { return y(d); });

var svg = d3.select("body").append("p").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("margin-left", -margin.left+"px")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



var yAxis = svg.append("g")
      .attr("class", "y axis")
      .call(y.axis = d3.svg.axis().scale(y).ticks(5).orient("left"));

svg.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", width)
    .attr("height", height);

var xAxis = svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(x.axis = d3.svg.axis().scale(x).orient("bottom"));


var path = svg.append("g")
    .attr("clip-path", "url(#clip)")
  .append("path")
    .data([data])
    .attr("class", "line")
    .attr("d", line);

function tick(v) {

  // update the domains
  now = new Date();
  //x.domain([now - (n - 2) * duration, now - duration]);
  y.domain([0, d3.max(data)]);//, function(data) {return data})]);

  // push the accumulated count onto the back, and reset the count
  data.push(v);
  /*{
    value: v,
    time: now
  });*/

  // redraw the line
  /*svg.select(".line")
      .attr("d", line)
      .attr("transform", "translate(" + x(-1) +")");
*/
  //    .attr("transform", "translate(" + x(now - (n - 2)*duration) + ")");

  // slide the x-axis left
  xAxis.transition()
      .duration(duration)
      .ease("linear")
      .call(x.axis);
  yAxis.transition()
      .duration(duration)
      .ease("linear")
      .call(y.axis);
  // slide the line left
  path.attr("d", line)
      .attr("transform", null)//"translate(" +x(0) +")")

    .transition()
      .duration(duration)
      .ease("linear")
      .attr("transform", "translate(" + x(-1)+")");
      //.attr("transform", "translate(" + x(now - (n - 1) * duration) + ")")
      //.each("end", tick);

  // pop the old data point off the front
  data.shift();

}

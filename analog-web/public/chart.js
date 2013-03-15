function Chart(id) {
  this.margin = {top: 6, right: 0, bottom: 16, left: 40};
  this.width = 900 - this.margin.right;
  this.height = 200 - this.margin.top - this.margin.bottom;

  this.timeWindow = 60000;
  this.data = [
    {time: new Date() - this.timeWindow, value: 0},
    {time: new Date(), value: 0}
  ];

  /*this.x = d3.scale.linear()
      .domain([start, end])
      .range([0,width]);*/
  this.x = d3.time.scale()
      .domain([new Date() - this.timeWindow, new Date()])
      .range([0, this.width]);

  this.y = d3.scale.linear()
      .range([this.height, 0]);

  //stupid js hack
  var self = this;
  this.line = d3.svg.line()
      .interpolate("linear")
      .x(function(d,i) { return self.x(d.time); })
      .y(function(d,i) { return self.y(d.value); });

  this.svg = d3.select("body").append("p").append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .style("margin-left", -this.margin.left+"px")
    .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");



  this.yAxis = this.svg.append("g")
        .attr("class", "y axis")
        .call(this.y.axis = d3.svg.axis().scale(this.y).ticks(5).orient("left"));

  this.svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", this.width)
      .attr("height", this.height);

  this.xAxis = this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.x.axis = d3.svg.axis().scale(this.x).orient("bottom"));


  this.path = this.svg.append("g")
      .attr("clip-path", "url(#clip)")
    .append("path")
      .data([this.data])
      .attr("class", "line")
      .attr("d", this.line);

  this.dt = 50;
  this.lag = 1000;
  this.yMax = 0;
  setInterval(function() {self.slide()}, this.dt);
};

Chart.prototype.slide = function() {
  // update the domains
  var now = new Date();
  this.x.domain([now - this.timeWindow-this.lag, now-this.lag]);
  while(this.data.length > 0
      && this.data[0].time < now - this.timeWindow - 3*this.lag)
    this.data.shift();
  //slide the axes left
  this.xAxis.transition()
      .duration(this.dt)
      .ease("linear")
      .call(this.x.axis);

  // slide the line left
  this.path
      .attr("d", this.line)
      .attr("transform", "translate(" +this.x(now-this.timeWindow) +")")
    .transition()
      .duration(this.dt)
      .ease("linear")
      .attr("transform", "translate(" +this.x(now-this.timeWindow-this.dt)+")");
};

Chart.prototype.tick = function(v) {
  // push the accumulated count onto the back, and reset the count
  var dMax = d3.max(this.data, function(d){return d.value});
  if((dMax > this.yMax) || (dMax + 0.1 < this.yMax)) {
    this.yMax = dMax;
    this.y.domain([0,this.yMax]);
    this.yAxis.transition()
        .duration(100)
        .ease("linear")
        .call(this.y.axis);
  }
  this.data.push({value: v, time: new Date()});
};

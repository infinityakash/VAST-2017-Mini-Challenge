var tooltip;
document.addEventListener("DOMContentLoaded", function () {
  tooltip = d3.select("#clock-tooltip");
});

var vehicleWeekCountMap = {};

var colorScale;

function getExtentsForVehicleCountMap() {
  var max = Number.MIN_VALUE;
  var min = Number.MAX_VALUE;

  for (var key in vehicleWeekCountMap) {
    if (vehicleWeekCountMap[key] > max) {
      max = vehicleWeekCountMap[key];
    }
    if (vehicleWeekCountMap[key] < min) {
      min = vehicleWeekCountMap[key];
    }
  }

  return [min, max];
}

function renderBubbleChart(bubbleData) {
  let bubbleSvg = d3.select("#bubbleChart");
  bubbleSvg.selectAll("*").remove();

  if (
    bubbleData == undefined ||
    bubbleData == [] ||
    bubbleData === null ||
    bubbleData.length == 0
  ) {
    bubbleSvg
      .attr("width", 500)
      .attr("height", 500)
      .attr("class", "bubble")
      .append("text")
      .attr("x", 175)
      .attr("y", 500 / 2)
      .attr("dy", ".35em")
      .text("No Data")
      .style("font-size", "35px");
    d3.select("#legendForBubble").selectAll("*").remove();
    return;
  }

  vehicleWeekCountMap = {};
  bubbleData.forEach(function (d) {
    var week = d.week;
    if (vehicleWeekCountMap[week] === undefined) {
      vehicleWeekCountMap[week] = 1;
    } else {
      vehicleWeekCountMap[week] = vehicleWeekCountMap[week] + 1;
    }
  });

  var d_arr = [];
  var i = 0;
  for (var key in vehicleWeekCountMap) {
    var countryGDPMapSet = {};
    countryGDPMapSet["Week"] = key;
    countryGDPMapSet["Name"] = "Week " + key;
    countryGDPMapSet["Count"] = vehicleWeekCountMap[key];
    d_arr[i] = countryGDPMapSet;
    i++;
  }

  var dataset = { children: d_arr };
  var diameter = 500;
  colorScale = d3
    .scaleSequential(colorScheme)
    .domain(getExtentsForVehicleCountMap());

  var bubble = d3.pack(dataset).size([diameter, diameter]).padding(1.5);

  bubbleSvg
    .attr("width", diameter)
    .attr("height", diameter)
    .attr("class", "bubble");

  var nodes = d3.hierarchy(dataset).sum(function (d) {
    return d.Count;
  });

  var node = bubbleSvg
    .selectAll(".node")
    .data(bubble(nodes).descendants())
    .enter()
    .filter(function (d) {
      return !d.children;
    })
    .append("g")
    .attr("class", "node")
    .attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

  node
    .append("circle")
    .attr("r", function (d) {
      return d.r;
    })
    .attr("id", function(d,i ){
      return "circle-"+i;
    })
    .style("fill", function (d, i) {
      return colorScale(d.data.Count);
    })
    .attr("stroke", "black")
    .on("mouseover", function (d) {
      tooltip.transition().duration(50).style("opacity", 1);
      var tooltipData = d.data.Name + " : " + d.data.Count;
      tooltip
        .html(tooltipData)
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY - 15 + "px");
    })

    .on("mousemove", function (d, i) {
      tooltip.transition().duration(50).style("opacity", 1);
      var tooltipData = d.data.Name + " : " + d.data.Count;
      tooltip
        .html(tooltipData)
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY - 15 + "px");
    })
    .on("mouseout", function (d, i) {
      tooltip.style("opacity", 0).style("x", "-20px").style("y", "-20px");
    })
    .on("click", function (d, i) {
      d3.selectAll("circle").attr("stroke-width", "1");
      d3.select(this).attr("stroke-width", "3");
      renderClock(bubbleData, d.data.Week);
    });

  renderClock(bubbleData, "1");
  d3.select("#circle-0").attr("stroke-width", "3");

  node
    .append("text")
    .attr("dy", ".2em")
    .style("text-anchor", "middle")
    .text(function (d) {
      return d.data.Name.substring(0, d.r / 3);
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", function (d) {
      return d.r / 5;
    })
    .attr("fill", "white");

  node
    .append("text")
    .attr("dy", "1.3em")
    .style("text-anchor", "middle")
    .text(function (d) {
      return d.data.Count;
    })
    .attr("font-family", "Gill Sans", "Gill Sans MT")
    .attr("font-size", function (d) {
      return d.r / 5;
    })
    .attr("fill", "white");

  d3.select(self.frameElement).style("height", diameter + "px");
  renderLegend();
}

function renderLegend() {
  var legendSvg = d3.select("#legendForBubble");
  legendSvg.selectAll("*").remove();

  legendSvg
    .append("text")
    .attr("id", "densityLegendTextForBubble")
    .attr("x", 20)
    .attr("y", 40)
    .text("Vehicle Density")
    .attr("font-size", "14px");

  margin = { top: 20, right: 60, bottom: 60, left: 100 };
  height = 20;
  width = 560;

  var domain = null;

  //set the domain
  if (colorScale.domain()[0] == colorScale.domain()[1])
    domain = colorScale.domain();
  else domain = [0, d3.max(colorScale.domain())];

  //axiscale for the legend
  axisScale = d3
    .scaleLinear()
    .domain(domain)
    .range([margin.left, width - margin.right]);

  axisBottom = (g) =>
    g
      .attr("class", `x-axis`)
      .attr("id", "xAxisScale")
      .attr("transform", `translate(-80,50)`)
      .call(
        d3
          .axisBottom(axisScale)
          .ticks(width / 80)
          .tickSize(20)
      )
      .call((g) => g.selectAll(".domain").attr("stroke", "white "))
      .call((g) => g.selectAll(".tick line").attr("stroke", "white"));

  var defsLegend = legendSvg.append("defs").attr("id", "defsID");

  var linGrad = defsLegend
    .append("linearGradient")
    .attr("id", "linear-gradient-bubble");

  linGrad
    .selectAll("stop")
    .data(
      colorScale.ticks().map((t, i, n) => ({
        offset: `${(100 * i) / n.length}%`,
        color: colorScale(t),
      }))
    )
    .enter()
    .append("stop")
    .attr("offset", (d) => d.offset)
    .attr("stop-color", (d) => d.color);

  legendSvg
    .append("g")
    .append("rect")
    .attr("id", "legendBubbleChart")
    .attr("x", 20)
    .attr("y", 50)
    .attr("width", 400)
    .attr("height", 20)
    .style("fill", "url(#linear-gradient-bubble)");

  legendSvg.append("g").call(axisBottom);
}

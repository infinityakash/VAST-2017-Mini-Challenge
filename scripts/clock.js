var handData, minuteScale, hourScale;
const radians = 0.0174532925,
  clockRadius = 200,
  clockMargin = 50,
  clockWidth = (clockRadius + clockMargin) * 2,
  clockHeight = (clockRadius + clockMargin) * 2;
(hourHandLength = (2 * clockRadius) / 3 - 30),
  (minuteHandLength = clockRadius - 30),
  (secondHandLength = clockRadius - 30),
  (secondHandBalance = 30),
  (secondTickStart = clockRadius);
(secondTickLength = -10), (hourTickStart = clockRadius), (hourTickLength = -18);
secondLabelRadius = clockRadius + 16;
secondLabelYOffset = 5;
hourLabelRadius = clockRadius + 16;
hourLabelYOffset = 7;

var colorScheme = d3.interpolateViridis;

var clock1Svg;
var clock2Svg;

document.addEventListener("DOMContentLoaded", function () {
  clock1Svg = d3.select("#clock_1");
  clock2Svg = d3.select("#clock_2");
  hourScale = d3.scaleLinear().range([0, 330]).domain([0, 11]);
  minuteScale = secondScale = d3.scaleLinear().range([0, 354]).domain([0, 59]);

  tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "clock-tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid")
    .style("border-radius", "4px")
    .style("font-size", "1.3rem");

  initialRender();
});

var vehicleCount = [];
var sliceColorScale;
var timeIntervalId = -1;

function renderClock(vehicleData, week) {
  loadClockData(vehicleData, week);
  d3.select("#hrly-vhl-cnt").html(`Week ${week} - Hourly Vehicle Count`);
  d3.select(self.frameElement).style("height", clockHeight + "px");
}

function moveHands() {
  var hours = new Date().getHours();
  var ampm = hours >= 12 ? "PM" : "AM";
  var id = "#clock-hands-1";
  if (ampm === "PM") {
    id = "#clock-hands-2";
  }
  d3.select(id)
    .selectAll("line")
    .data(handData)
    .attr("transform", function (d) {
      return "rotate(" + d.scale(d.value) + ")";
    });
}

function updateData() {
  var t = new Date();
  handData[0].value = (t.getHours() % 12) + t.getMinutes() / 60;
  handData[1].value = t.getMinutes();
  handData[2].value = t.getSeconds();
}

function loadClockData(vehicleData, week) {
  vehicleCount = [];
  for (i = 0; i < 24; i++) {
    vehicleCount[i] = 0;
  }

  vehicleData.forEach(function (d) {
    if (d.week === week) {
      vehicleCount[parseInt(d.time)] += 1;
    }
  });

  sliceColorScale = d3
    .scaleSequential(colorScheme)
    .domain(getExtentsForVehicleCount(vehicleCount));

  drawClock();
  renderLegendForClock(vehicleData);
}

function getExtentsForVehicleCount(vehicleCount) {
  var max = Number.MIN_VALUE;
  var min = Number.MAX_VALUE;

  for (i = 0; i < 24; i++) {
    if (vehicleCount[i] >= max) {
      max = vehicleCount[i];
    }
    if (vehicleCount[i] < min) {
      min = vehicleCount[i];
    }
  }
  return [min, max];
}

function initialRender() {
  clock1Svg.selectAll("*").remove();
  clock1Svg.attr("width", clockWidth).attr("height", clockHeight);

  clock1Svg
    .append("g")
    .attr("id", "clock-face")
    .attr(
      "transform",
      "translate(" +
        (clockRadius + clockMargin) +
        "," +
        (clockRadius + clockMargin) +
        ")"
    );

  var face = clock1Svg.select("#clock-face");
  drawClockTicks(face);
  drawClockHands(face, 1);
  face.append("g").attr("class", "face-slices");
  drawClockLabels(face, 0);

  clock2Svg.selectAll("*").remove();
  clock2Svg.attr("width", clockWidth).attr("height", clockHeight);

  clock2Svg
    .append("g")
    .attr("id", "clock-face-2")
    .attr(
      "transform",
      "translate(" +
        (clockRadius + clockMargin) +
        "," +
        (clockRadius + clockMargin) +
        ")"
    );

  var face2 = d3.select("#clock-face-2");
  drawClockTicks(face2);
  drawClockHands(face2, 2);
  face2.append("g").attr("class", "face-slices");
  drawClockLabels(face2, 12);

  clearInterval(timeIntervalId);
  timeIntervalId = setInterval(function () {
    updateData();
    moveHands();
  }, 1000);
}

function drawClock() {
  var face = clock1Svg.select("#clock-face");
  drawClockSlices(face, 0);

  var face2 = d3.select("#clock-face-2");
  drawClockSlices(face2, 12);
}

function drawClockSlices(clockFace, timeOffset) {
  var slices = [];
  for (i = 0; i < 12; i++) {
    var entry = {};
    entry["startAngle"] = i * 30 * radians;
    entry["endAngle"] = (i * 30 + 30) * radians;
    entry["vehicleCount"] = vehicleCount[i + timeOffset];
    slices[i] = entry;
  }
  clockFace.select(".face-slices").selectAll("*").remove();
  clockFace
    .select(".face-slices")
    .selectAll("slice")
    .data(slices)
    .enter()
    .append("path")
    .attr("d", d3.arc().innerRadius(0).outerRadius(clockRadius))
    .attr("fill", function (d) {
      return sliceColorScale(d.vehicleCount);
    })
    .attr("stroke", "black")
    .attr("stroke-opacity", 0.2)
    .style("opacity", 0.8)
    .on("mouseover", function (d, i) {
      d3.select(this)
        .transition()
        .duration(100)
        .ease(d3.easeBounceOut)
        .attr(
          "d",
          d3
            .arc()
            .innerRadius(0)
            .outerRadius(clockRadius + 30)
        )
        .attr("stroke-opacity", 1);
      // .style("opacity", 1);
      tooltip.transition().duration(50).style("opacity", 1);
      var text = "Vehicle Count: " + d.vehicleCount;
      tooltip
        .html(text)
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY - 15 + "px");
    })
    .on("mousemove", function (d, i) {
      d3.select(this)
        .transition()
        .duration(100)
        .ease(d3.easeBounceOut)
        .attr(
          "d",
          d3
            .arc()
            .innerRadius(0)
            .outerRadius(clockRadius + 30)
        )
        .attr("stroke-opacity", 1);
      // .style("opacity", 1);
      tooltip.transition().duration(50).style("opacity", 1);
      var text = "Vehicle Count: " + d.vehicleCount;
      tooltip
        .html(text)
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY - 15 + "px");
    })
    .on("mouseout", function (d, i) {
      tooltip
        .transition()
        .duration(10)
        .style("opacity", 0)
        .style("left", "-20px")
        .style("top", "-20px");
      d3.select(this)
        .transition()
        .duration(100)
        .ease(d3.easeBounceIn)
        .attr("d", d3.arc().innerRadius(0).outerRadius(clockRadius))
        .attr("stroke-opacity", 0.2)
        .style("opacity", 0.8);
    });
}

function drawClockHands(clockFace, id) {
  handData = [
    {
      type: "hour",
      value: 0,
      length: -hourHandLength,
      scale: hourScale,
    },
    {
      type: "minute",
      value: 0,
      length: -minuteHandLength,
      scale: minuteScale,
    },
    {
      type: "second",
      value: 0,
      length: -secondHandLength,
      scale: secondScale,
      balance: secondHandBalance,
    },
  ];
  var hands = clockFace.append("g").attr("id", "clock-hands-" + id);
  hands
    .selectAll("line")
    .data(handData)
    .enter()
    .append("line")
    .style("opacity", 1)
    .attr("class", function (d) {
      return d.type + "-hand";
    })
    .attr("x1", 0)
    .attr("y1", function (d) {
      return d.balance ? d.balance : 0;
    })
    .attr("x2", 0)
    .attr("y2", function (d) {
      return d.length;
    })
    .attr("transform", function (d) {
      return "rotate(" + d.scale(d.value) + ")";
    });
}

function drawClockTicks(clockFace) {
  //add marks for seconds
  clockFace
    .append("g")
    .attr("class", "second-ticks")
    .selectAll(".second-tick")
    .data(d3.range(0, 60))
    .enter()
    .append("line")
    .attr("class", "second-tick")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", secondTickStart)
    .attr("y2", secondTickStart + secondTickLength)
    .style("opacity", 1)
    .attr("transform", function (d) {
      return "rotate(" + secondScale(d) + ")";
    });

  //... and hours
  clockFace
    .append("g")
    .attr("class", "hour-ticks")
    .selectAll(".hour-tick")
    .data(d3.range(0, 12))
    .enter()
    .append("line")
    .attr("class", "hour-tick")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", hourTickStart)
    .attr("y2", hourTickStart + hourTickLength)
    .style("opacity", 1)
    .attr("transform", function (d) {
      return "rotate(" + hourScale(d) + ")";
    });
}

function drawClockLabels(clockFace, timeOffset) {
  clockFace
    .append("g")
    .attr("class", "hour-labels")
    .selectAll(".hour-label")
    .data(d3.range(1 + timeOffset, 13 + timeOffset, 1))
    .enter()
    .append("text")
    .attr("class", "hour-label")
    .attr("text-anchor", "middle")
    .attr("x", function (d) {
      return hourLabelRadius * Math.sin(hourScale(d) * radians);
    })
    .attr("y", function (d) {
      return (
        -hourLabelRadius * Math.cos(hourScale(d) * radians) + hourLabelYOffset
      );
    })
    .text(function (d) {
      if (d == 12) {
        return "12|00";
      } else if (d == 24) {
        return "24|12";
      } else if (d >= 1 && d < 10) {
        return "0" + d;
      }
      return d;
    });
}

function renderLegendForClock(vehicleData) {
  if (
    vehicleData == undefined ||
    vehicleData == [] ||
    vehicleData === null ||
    vehicleData.length == 0
  ) {
    d3.select("#legendForClock").selectAll("*").remove();
    return;
  }

  var legendSvg = d3.select("#legendForClock");
  legendSvg.selectAll("*").remove();

  legendSvg
    .append("text")
    .attr("id", "densityLegendTextForClock")
    .attr("x", 20)
    .attr("y", 40)
    .text("Vehicle Density")
    .attr("font-size", "14px");

  margin = { top: 20, right: 60, bottom: 60, left: 100 };
  height = 20;
  width = 720;

  var domain = null;

  //set the domain
  if (sliceColorScale.domain()[0] == sliceColorScale.domain()[1])
    domain = sliceColorScale.domain();
  else domain = [0, d3.max(sliceColorScale.domain())];

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
    .attr("id", "linear-gradient-clock");

  linGrad
    .selectAll("stop")
    .data(
      sliceColorScale.ticks().map((t, i, n) => ({
        offset: `${(100 * i) / n.length}%`,
        color: sliceColorScale(t),
      }))
    )
    .enter()
    .append("stop")
    .attr("offset", (d) => d.offset)
    .attr("stop-color", (d) => d.color);

  legendSvg
    .append("g")
    .append("rect")
    .attr("id", "legendClockChart")
    .attr("x", 20)
    .attr("y", 50)
    .attr("width", 560)
    .attr("height", 20)
    .style("fill", "url(#linear-gradient-clock)");

  legendSvg.append("g").call(axisBottom);
}

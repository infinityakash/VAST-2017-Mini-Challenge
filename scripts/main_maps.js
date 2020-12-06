var spatialMapSvg, flowMapSvg;
var plotSize = { height: 510, width: 510 };
var plotMargin = { left: 0, top: 0, right: 0, bottom: 0 };

var mapFile = "./map_spatial.svg";
var isMapReady = false;

var gateSvgXYMap = {};
const NO_POINT = "None";
var selectedPoint = NO_POINT;

var spatialListener = null;
const mapDensityColorScheme = d3.interpolateWarm; //d3.interpolateViridis;
var colorScale = null;

document.addEventListener("DOMContentLoaded", function () {
  spatialMapSvg = d3.select(".spatialMap");
  spatialMapSvg
    .append("rect")
    .attr("width", plotSize.width)
    .attr("height", plotSize.height)
    .attr("fill", "#fafafa")
    .attr("stroke", "grey")
    .attr("class", "plotBg");

  flowMapSvg = d3.select(".flowmap");
  flowMapSvg
    .append("rect")
    .attr("width", plotSize.width)
    .attr("height", plotSize.height)
    .attr("fill", "#fafafa")
    .attr("stroke", "grey")
    .attr("class", "plotBg");

  drawBaseMap();

  spatialMapSvg.append("g").attr("class", "plot_layer");
});

function drawBaseMap() {
  d3.xml(mapFile).then((map) => {
    spatialMapSvg
      .append("g")
      .attr("class", "map")
      .node()
      .append(map.documentElement.cloneNode(true));

    flowMapSvg
      .append("g")
      .attr("class", "map")
      .node()
      .append(map.documentElement.cloneNode(true));
    flowMapSvg.append("g").attr("class", "plotLayer");

    spatialMapSvg
      .select("#layer5")
      .selectAll("circle")
      .each(function (d, i) {
        let element = d3.select(this);
        gateSvgXYMap[element.attr("id")] = {
          x: element.attr("cx"),
          y: element.attr("cy"),
          color: element.attr("fill"),
        };
      })
      .style("cursor", "pointer")
      .on("click", function (d, i) {
        selectedPoint = d3.select(this).attr("id");
        report();
      });

    spatialMapSvg.select("#layer5").selectAll("circle").attr("stroke", "black");

    spatialMapSvg.select(".plotBg").on("click", function (d) {
      selectedPoint = NO_POINT;
      report();
    });

    flowMapSvg.select("#layer5").selectAll("circle").attr("stroke", "black");

    isMapReady = true;
    report();
  });

  drawGateLegend();
}

function setSpatialListener(lambda) {
  this.spatialListener = lambda;
}

function report() {
  if (spatialListener == null) {
    return;
  }

  spatialListener(selectedPoint);
}

function renderMapData(data, selectedPoint) {
  renderSpatialMap(data, selectedPoint);
  renderFlowMap(data, selectedPoint);
}

function drawGateLegend() {
  // @jayesh: gate legends

  var legendSvg = d3.select("#legend");

  // gatetypes and color for each of them
  var gateTypes = [
    "Entrance",
    "General Gate",
    "Ranger Stop",
    "Camping",
    "Ranger Base",
    "Gate",
  ];
  var gatecolors = [
    "#00ff00",
    "#00ffff",
    "#ffff00",
    "#ff6600",
    "#ff00ff",
    "#ff0000",
  ];

  //Legend Heading
  legendSvg
    .append("text")
    .attr("x", 62)
    .attr("y", 65)
    .text("Gate Types")
    .attr("font-family", "sans-serif")
    .attr("font-size", "18px");

  // one circle for each gate
  legendSvg
    .selectAll("gateDots")
    .data(gatecolors)
    .enter()
    .append("circle")
    .attr("cx", (d, i) => {
      return 70;
    })
    .attr("cy", (d, i) => {
      return 20 * i + 80;
    })
    .attr("r", 5)
    .style("fill", (d, i) => {
      return d;
    })
    .style("stroke", "black");

  // text for each circle
  legendSvg
    .selectAll("gateLabels")
    .data(gateTypes)
    .enter()
    .append("text")
    .attr("x", (d, i) => {
      return 80;
    })
    .attr("y", (d, i) => {
      return 20 * i + 85;
    })
    .style("fill", "black")
    .text(function (d) {
      return d;
    })
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")
    .attr("font-family", "sans-serif")
    .attr("font-size", "12px");
}

function updateMapScale() {
  // @jayesh: map hue scale

  d3.select("#legendFlowMap").remove();
  d3.select("#linGrad").remove();
  d3.select("#xAxisScale").remove();
  d3.select("#defsID").remove();
  d3.select("#densityLegendText").remove();

  var legendSvg = d3.select("#legend");

  legendSvg
    .append("text")
    .attr("id", "densityLegendText")
    .attr("x", 22)
    .attr("y", 495)
    .text("Vehicle Density")
    .attr("font-family", "sans-serif")
    .attr("font-size", "12px");

  margin = { top: 20, right: 60, bottom: 60, left: 100 };
  height = 20;
  width = 360;

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
      .attr("transform", `translate(-80,500)`)
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
    .attr("id", "linear-gradient");

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
    .attr("id", "legendFlowMap")
    .attr("x", 20)
    .attr("y", 500)
    .attr("width", 200)
    .attr("height", 20)
    .style("fill", "url(#linear-gradient)");

  legendSvg.append("g").call(axisBottom);
}

function renderSpatialMap(car_route_data, selectedPoint) {
  if (!isMapReady || !car_route_data) return;

  let data = aggregateGateData(car_route_data);

  let plotLayer = spatialMapSvg.select(".plot_layer");

  let dataExtent = d3.extent(data, function (d) {
    return d["value"];
  });

  let radiusScale = d3.scaleLinear().domain(dataExtent).range([15, 90]);
  colorScale = d3.scaleSequential(mapDensityColorScheme).domain(dataExtent);
  updateMapScale();
  plotLayer.selectAll(".gateCount").remove();
  tooltip = d3.select("#clock-tooltip");
  plotLayer
    .selectAll(".gateCount")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "gateCount")
    .attr("id", function (d, i) {
      return "gate" + d["key"];
    })
    .call((g) => {
      g.append("circle")
        .attr("cx", function (d, i) {
          return gateSvgXYMap[d["key"]].x;
        })
        .attr("cy", function (d, i) {
          return gateSvgXYMap[d["key"]].y;
        })
        .attr("r", function (d, i) {
          // if(selectedPoint == NO_POINT || selectedPoint == d["key"])
          return radiusScale(d["value"]);
        })
        .attr("fill", function (d, i) {
          return colorScale(d["value"]); //gateSvgXYMap[d["key"]].color;
        })
        .style("opacity", function (d, i) {
          if (selectedPoint == NO_POINT || selectedPoint == d["key"]) {
            return "0.5";
          } else return "0.2";
        });
    })
    .each((d) => {
      spatialMapSvg
        .select("#" + d["key"])
        .on("mouseover", function () {
          tooltip.transition().duration(50).style("opacity", 1);
          var text = d.key + " " + d.value;
          tooltip
            .html(text)
            .style("left", d3.event.pageX + 10 + "px")
            .style("top", d3.event.pageY - 15 + "px");
        })
        .on("mousemove", function () {
          tooltip.transition().duration(50).style("opacity", 1);
          var text = d.key + " : " + d.value;
          tooltip
            .html(text)
            .style("left", d3.event.pageX + 10 + "px")
            .style("top", d3.event.pageY - 15 + "px");
        })
        .on("mouseout", function () {
          tooltip
            .transition()
            .duration(10)
            .style("opacity", 0)
            .style("left", "-20px")
            .style("top", "-20px");
        });
    });
}

function aggregateGateData(data) {
  return d3
    .nest()
    .key(function (d) {
      return d.source;
    })
    .rollup(function (v) {
      return v.length;
    })
    .entries(data);
}

function renderFlowMap(dataForFlowMap, sourceGate) {
  if (!isMapReady || !dataForFlowMap) return;

  let pltLayer = flowMapSvg.select(".plotLayer");

  pltLayer.selectAll("*").remove();
  var toShow;
  // THis is the data that needs to be shown on the flowmap. This is assigned from the variable: dataForFlowMap
  if (sourceGate == NO_POINT) toShow = dataForFlowMap;
  else toShow = dataForFlowMap.filter((d) => d.source == sourceGate);

  // Nested function that helps in modifying data in the form of key(source { key:destination, value}) type
  let aggregatedData = aggregateFlowData(toShow);

  let dataToDraw = [];
  for (row of aggregatedData) {
    let arr = [];

    for (x of row.values) {
      arr = {
        source: row.key,
        destination: x.key,
        value: +x.value,
      };
      dataToDraw.push(arr);
    }
  }

  var gRoute = pltLayer.append("g");
  pltLayer
    .append("svg:defs")
    .selectAll("marker")
    .data(["end"]) // Different link/path types can be defined here
    .enter()
    .append("svg:marker") // This section adds in the arrows
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 10)
    .attr("refY", 0)
    .attr("markerWidth", 1.6)
    .attr("markerHeight", 1.6)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

  var strokeScale = d3
    .scaleLinear()
    .domain(
      d3.extent(dataToDraw, function (d) {
        return d.value;
      })
    )
    .range([2, 10]);

  gRoute
    .selectAll(".route")
    .data(dataToDraw)
    .enter()
    .append("path")
    // .transition()
    // .duration(100)
    .attr("class", "route")
    .attr("d", flowPath)
    .attr("fill", "none")
    .attr("stroke", function (d) {
      return colorScale(d["value"]); //gateSvgXYMap[d.source].color;
    })
    .attr("marker-end", "url(#arrow)")
    .style("stroke-width", function (d) {
      return strokeScale(d.value);
    })
    .attr("opacity", "0.75")
    .on("mouseover", function (d) {
      tooltip.transition().duration(50).style("opacity", 1);
      var text = getFlowMapToolTipText(d);
      tooltip
        .html(text)
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY - 15 + "px");
    })
    .on("mousemove", function (d) {
      tooltip.transition().duration(50).style("opacity", 1);
      var text = getFlowMapToolTipText(d);
      tooltip
        .html(text)
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY - 15 + "px");
    })
    .on("mouseout", function (d) {
      tooltip
        .transition()
        .duration(10)
        .style("opacity", 0)
        .style("left", "-20px")
        .style("top", "-20px");
    });
}

function getFlowMapToolTipText(d) {
  return `${d.value} vehicles<br/>from <strong>${d.source}</strong> to <strong>${d.destination}</strong>`;
}

function flowPath(d) {
  var source = gateSvgXYMap[d.source];
  var target = gateSvgXYMap[d.destination];
  var x1 = source.x,
    y1 = source.y,
    x2 = target.x,
    y2 = target.y,
    dx = x2 - x1,
    dy = y2 - y1,
    dr = 0.8 * Math.sqrt(dx * dx + dy * dy),
    // Defaults for normal edge.
    drx = dr,
    dry = dr,
    xRotation = 0, // degrees
    largeArc = 0, // 1 or 0
    sweep = 1; // 1 or 0

  // Self edge.
  if (x1 === x2 && y1 === y2) {
    // Fiddle with this angle to get loop oriented.
    xRotation = -45;

    // Needs to be 1.
    largeArc = 1;

    // Change sweep to change orientation of loop.
    //sweep = 0;

    // Make drx and dry different to get an ellipse
    // instead of a circle.
    drx = 25;
    dry = 30;

    // For whatever reason the arc collapses to a point if the beginning
    // and ending points of the arc are the same, so kludge it.
    x2 = x2 + 1;
    y2 = y2 + 1;
  }

  return (
    "M" +
    x1 +
    "," +
    y1 +
    "A" +
    drx +
    "," +
    dry +
    " " +
    xRotation +
    "," +
    largeArc +
    "," +
    sweep +
    " " +
    x2 +
    "," +
    y2
  );
}

function aggregateFlowData(data) {
  return d3
    .nest()
    .key(function (d) {
      return d.source;
    })
    .key(function (d) {
      return d.destination;
    })
    .rollup(function (v) {
      return v.length;
    })
    .entries(data);
}

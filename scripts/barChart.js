var barSVGWidth = 600,
  barSVGHeight = 650;

var barMargin = 200,
  barChartWidth = barSVGWidth - barMargin,
  barChartHeight = 600 - barMargin;

var vehicleTypeCount = {};

function renderBarChart(barChartData) {
  vehicleTypeCount = {};
  barChartSvg = d3.select("#barChart");
  barChartSvg.selectAll("text").remove();
  barChartSvg.selectAll("g").remove();

  barChartData.forEach(function (d) {
    var car = d.cartype;
    if (vehicleTypeCount[car] === undefined) {
      vehicleTypeCount[car] = 0;
    } else {
      vehicleTypeCount[car] = vehicleTypeCount[car] + 1;
    }
  });

  barChartSvg.attr("width", barSVGWidth).attr("height", barSVGHeight);

  barChartSvg
    .append("text")
    .attr("transform", "translate(100,0)")
    .attr("x", 50)
    .attr("y", 50)
    .attr("font-size", "24px")
    .text("Vehicle Type Distribution");

  if (
    barChartData == undefined ||
    barChartData == [] ||
    barChartData === null ||
    barChartData.length == 0
  ) {
    barChartSvg
      .attr("class", "barChart")
      .append("text")
      .attr("x", 600 / 2 - 80)
      .attr("y", 600 / 2)
      .attr("dy", ".35em")
      .text("No Data")
      .style("font-size", "35px");
    return;
  }

  let xScale = d3.scaleBand().range([0, barChartWidth]),
    yScale = d3.scaleLinear().range([barChartHeight, 0]);

  let g = barChartSvg
    .append("g")
    .attr("transform", "translate(" + 100 + "," + 100 + ")");

  let d_arr = [];
  let i = 0;
  for (var key in vehicleTypeCount) {
    var countryGDPMapSet = {};
    countryGDPMapSet["x"] = key;
    countryGDPMapSet["y"] = vehicleTypeCount[key];
    d_arr[i] = countryGDPMapSet;
    i++;
  }
  let keys = d3.keys(vehicleTypeCount);
  xScale.domain(keys);
  yScale.domain([0, d3.max(d3.values(vehicleTypeCount))]);

  g.append("g")
    .attr("transform", "translate(0," + barChartHeight + ")")
    
    .call(
      d3.axisBottom(xScale).tickFormat(function (d) {
        if (d == 1) {
          return "2 axle car";
        } else if (d == 2) {
          return "2 axle truck";
        } else if (d == 3) {
          return "3 axle truck";
        } else if (d == 4) {
          return "4+ axle truck";
        } else if (d == 5) {
          return "2 axle bus";
        } else if (d == 6) {
          return "3 axle bus";
        } else {
          return "preserve vehicle";
        }
      })
    ).call((g)=>{
        g.selectAll('.domain').remove()
    })
    .selectAll(".tick text")
    .style("font-size", "14px")
    .attr("transform", "rotate(-45) , translate(-10,-10)")
    .style("color", "#C0C0BB")
    
    .attr("text-anchor", "end");

  g.append("text")
    .attr("y", barSVGHeight - 120)
    .attr("x", barChartWidth / 2 + 30)
    .attr("text-anchor", "end")
    .attr("font-size", "18px")
    .text("Vehicle Type");

  g.append("g")
    .call(
      d3
        .axisLeft(yScale)
        .tickSize(-barChartWidth)
        .tickPadding(10)
        .tickFormat(function (d) {
          return d;
        })
        
        .ticks(10)
    )
    .style("stroke-dasharray", "5 3").selectAll('.domain').remove()
    .selectAll(".tick text")
    .style("font-size", "14px")
    .style("color", "gray");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", barMargin - 180)
    .attr("x", -barChartHeight / 2 + 50)
    .attr("dy", "-5.1em")
    .attr("text-anchor", "end")
    .attr("font-size", "18px")
    .text("Vehicle Count");

  g.selectAll(".bar")
    .data(d_arr)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", function (d) {
      return xScale(d.x) + 10;
    })
    .attr("y", (d) => {
      return yScale(d.y);
    })
    .attr("width", xScale.bandwidth() - 20)
    .attr("height", function (d) {
      return barChartHeight - yScale(d.y);
    });
}

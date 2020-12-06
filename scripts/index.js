var car_route_data_file = "/data/car_route_data.csv";
var part1_data_file = "/data/part1_data.csv";
var overnight_stay_data_file = "/data/overnight_stay_data.csv";

var selectedPointId = NO_POINT;
var car_route_data = [];
var filteredCarRouteData = car_route_data;
var overnight_stay_data = [];
var part1_data = [];

var currentYear = "All";
var currentMonth = "All";
var currentGate = "All";
var currentCarType = "All";

function yearFilter(value) {
  console.log("yearFilter called " + value);
  currentYear = value;

  changeGraph();
}

function monthFilter(value) {
  console.log("monthFilter called " + value);
  currentMonth = value;

  changeGraph();
}

function gateFilter(value) {
  console.log("gateFilter called " + value);
  currentGate = value;

  changeGraph();
}

function carTypeFilter(value) {
  console.log("carTypeFilter called " + value);
  currentCarType = value;

  changeGraph();
}

function changeGraph() {
  filteredCarRouteData = car_route_data;
  let filteredPart1Data = part1_data;
  console.log(currentGate + " " + currentMonth + " " + currentYear + " " + currentCarType);
  if (currentYear != "All") {
    filteredPart1Data = filteredPart1Data.filter(
      (row) => row.year == currentYear
    );
    filteredCarRouteData = filteredCarRouteData.filter(
      (row) => row.year == currentYear
    );
  }
  if (currentMonth != "All") {
    filteredPart1Data = filteredPart1Data.filter(
      (row) => row.month == currentMonth
    );
    filteredCarRouteData = filteredCarRouteData.filter(
      (row) => row.month == currentMonth
    );
  }
  if (currentCarType != "All") {
    filteredPart1Data = filteredPart1Data.filter(
      (row) => row.cartype == currentCarType
    );
    filteredCarRouteData = filteredCarRouteData.filter(
      (row) => row.cartype == currentCarType
    );
  }
  if (currentGate != "All") {
    filteredPart1Data = filteredPart1Data.filter(
      (row) => row.gatetype == currentGate
    );
    filteredCarRouteData = filteredCarRouteData.filter(
      (row) => row.gatetype == currentGate
    );
  }
  // console.log(filteredPart1Data);
  renderBarChart(filteredPart1Data);
  renderBubbleChart(filteredPart1Data);
  renderClock(filteredPart1Data, "1");
  renderMapData(this.filteredCarRouteData, this.selectedPointId);
  updateMapTitles()
}

window.addEventListener("load", function () {
  console.log("Default data loader called");

  // Code to reset filter values upon default page load
  document.getElementById("yearFilter").selectedIndex = 0;
  document.getElementById("monthFilter").selectedIndex = 0;
  document.getElementById("gateFilter").selectedIndex = 0;
  document.getElementById("carTypeFilter").selectedIndex = 0;

  Promise.all([
    d3.csv(car_route_data_file),
    d3.csv(part1_data_file),
    d3.csv(overnight_stay_data_file),
  ]).then(function (values) {
    car_route_data = values[0];
    part1_data = values[1];
    overnight_stay_data = values[2];

    setSpatialListener(mapPointClickListener);
    filteredCarRouteData = car_route_data;
    mapPointClickListener(NO_POINT);
    changeGraph();
  });
});

function mapPointClickListener(pointId) {
  this.selectedPointId = pointId;
  currentGate = this.selectedPointId.substring(
    0,
    this.selectedPointId.length - 1
  );

  if (currentGate == "Non") currentGate = "All";

  if (currentGate === "ranger-bas") currentGate = "ranger-base";

  document.getElementById("gateFilter").value = currentGate;

  changeGraph();
  renderMapData(this.filteredCarRouteData, pointId);
}

function updateMapTitles(){
  if(this.selectedPointId == NO_POINT){
    d3.select("#spatial-map-title").html(`Gate-Vehicle Density`);
    d3.select("#flow-map-title").html(`Gate-Vehicle Flow`);
  }else{
    d3.select("#spatial-map-title").html(`${this.selectedPointId} - Vehicle Density`);    
    d3.select("#flow-map-title").html(`${this.selectedPointId} - Vehicle Flow`);    
  }
}


var socket = io.connect("http://localhost:1600/dashboard.html#/currentride");
var map;

function getMapView(){
	console.log('initialize socket io-client');
	socket.emit('rider view');
};

socket.on("map view", function (data){
  for(var i = 0; i < data.length; i++) {
    var driverLong = data[i].long;
    var driverLat = data[i].lat;
    markers.insertNewMarker(driverLat, driverLong);
  }
});
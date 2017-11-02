/**
 *
 */
function AutocompleteDirectionsHandler(map) {
    this.map = map;
    this.originPlaceId = null;
    this.destinationPlaceId = null;
    this.travelMode = 'DRIVING';
    var originInput = document.getElementById('origin-input');
    var destinationInput = document.getElementById('destination-input');
    var submitButton = document.getElementById('submit-button');
    this.directionsService = new google.maps.DirectionsService;
    this.directionsDisplay = new google.maps.DirectionsRenderer;
    this.directionsDisplay.setMap(map);
    this.directionsDisplay.setPanel(document.getElementById('directionsPanel'));

    var originAutocomplete = new google.maps.places.Autocomplete(
        originInput, {
            placeIdOnly: true
        });
    var destinationAutocomplete = new google.maps.places.Autocomplete(
        destinationInput, {
            placeIdOnly: true
        });

    submitButton.onclick = function () {
        location.href = "#openModal";
    };

    this.setupPlaceChangedListener(originAutocomplete, 'ORIG');
    this.setupPlaceChangedListener(destinationAutocomplete, 'DEST');

    this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(originInput);
    this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(destinationInput);
    this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(submitButton);

}


AutocompleteDirectionsHandler.prototype.setupPlaceChangedListener = function(autocomplete, mode) {
    var me = this;
    autocomplete.bindTo('bounds', this.map);
    autocomplete.addListener('place_changed', function() {
        var place = autocomplete.getPlace();

        if (!place.place_id) {
            window.alert("Please select an option from the dropdown list.");
            return;
        }
        if (mode === 'ORIG') {
            me.originPlaceId = place.place_id;
            getGeocode(me.originPlaceId);

        } else {
            me.destinationPlaceId = place.place_id;
            getGeocode(me.destinationPlaceId);
        }
        me.route();
    });

}

AutocompleteDirectionsHandler.prototype.route = function() {
    if (!this.originPlaceId || !this.destinationPlaceId) {
        return;
    }

    //EITHER ORIGIN OR DESTINATION MUST BE AIRPORT, CANNOT BE NEAR AIRPORT LIKE THE LUGGAGE PICK UP LOCATION
    var airportPlaceId = validAirportPlace();
    if (airportPlaceId.includes(this.originPlaceId) || airportPlaceId.includes(this.destinationPlaceId)) {
        var me = this;

        this.directionsService.route({
            origin: {
                'placeId': this.originPlaceId
            },
            destination: {
                'placeId': this.destinationPlaceId
            },
            travelMode: this.travelMode
        }, function(response, status) {
            if (status === 'OK') {
                me.directionsDisplay.setDirections(response);
                // console.log("~~~~~~~~~~~~~~~~~~~~~");
                // console.log("distance: " + response.routes[0].legs[0].distance.text);
                // console.log("duration: " + response.routes[0].legs[0].duration.text);
                // console.log("main road taken: " + response.routes[0].summary);
                // console.log("~~~~~~~~~~~~~~~~~~~~~");
                calculatePrice(response.routes[0].legs[0].distance.value, response.routes[0].legs[0].duration.value);
                console.log("~~~~~~~~~Test Array~~~~~~~~~~~~~~");
                console.log(details(response.geocoded_waypoints[0].place_id, response.geocoded_waypoints[1].place_id));
                // console.log(response.geocoded_waypoints[0].place_id);
                // console.log(testGeocode(response.geocoded_waypoints[0].place_id));
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
    } else {
        alert("Either the origin or destination must be an airport (SFO, SJC, or OAK)");
        location.reload();
    }
}

function getAddressFromLatLang(lat, lng, geocoder) {
    //console.log("Entering getAddressFromLatLang()");
    var latLng = new google.maps.LatLng(lat, lng);
    geocoder.geocode({
        'latLng': latLng
    }, function(results, status) {
        //console.log("After getting address");
        //console.log(results);
        if (status == google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                console.log(results[0].formatted_address);
                console.log("County: " + findCounty(results));
                //alert(results[0].formatted_address);
            }
        } else {
            alert("Geocode was not successful for the following reason: " + status);
        }

    });
    //console.log("Exiting getAddressFromLatLang()");
}

function findCounty(results) {
    var filtered_array = results[0].address_components.filter(function(address_component) {
        return address_component.types.includes("administrative_area_level_2");
    });
    var county = filtered_array.length ? filtered_array[0].long_name : "";
    if (!validCounty(county)) {
        alert("Out of County Boundaries, Please Enter a Different location");
        //document.getElementById('origin-input').value = "";
        //document.getElementById('destination-input').value = "";
        location.reload();
    }
    return county;
}

function validCounty(county) {
    return county == 'Alameda County' || county == 'San Mateo County' || county == 'Santa Clara County';
}

function getGeocode(placeid) {
    //array to store the latitude and longitude
    var loc = [];
    // create a new Geocoder object
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'placeId': placeid
    }, function(results, status) {
        // and this is function which processes response
        if (status == google.maps.GeocoderStatus.OK) {
            loc[0] = results[0].geometry.location.lat();
            loc[1] = results[0].geometry.location.lng();

            //alert(loc); // the place where loc contains geocoded coordinates
            getAddressFromLatLang(loc[0], loc[1], geocoder);

        } else {
            alert("Geocode was not successful for the following reason: " + status);
        }
    });
}

function calculatePrice(distanceInMeters, durationInSeconds) {
    var baseFare = 2.5;
    var pricePerMinute = 0.24;
    var pricePerMile = 1.95; //remember to give first 2 miles for free

    // duration is in seconds and distance is in meters, so we have to covert
    // into minutes and miles
    var durationInMinutes = (durationInSeconds / 60).toFixed(0);
    var distanceInMiles = (distanceInMeters / 1609.34).toFixed(1);
    console.log(durationInMinutes);
    console.log(distanceInMiles);

    //total will show price of 15 dollar minimum
    var d = new Date();
    var total = Math.max(baseFare + (durationInMinutes * pricePerMinute) + ((distanceInMiles - 2) * pricePerMile), 15).toFixed(2);

    document.getElementById("estimate").innerHTML = "Estimated Arrival : " + msToTime(d.getTime() - (1000*60*60*7) + (durationInMinutes * 60 *1000));
    document.getElementById("distance").innerHTML = "Total Distance : " + distanceInMiles + " miles";
    document.getElementById("duration").innerHTML = "Total Duration : " + durationInMinutes + " minutes";
    document.getElementById("price").innerHTML = "Total Calculated Price : $" + total;
    document.getElementById('confirm').setAttribute("class", "btn-confirm");
    document.getElementById('decline').setAttribute("class", "btn-decline");
    document.getElementById('close').setAttribute("class", "hidden");
}

function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60)%24));

    var end = "AM";
    if(hours > 12) {
      end = "PM";
      hours %= 12;
    }

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + " " + end;
}

//array of place ids of airports, including some nearby stuff like cellphone lots, parking, baggage pickup locations
//see google drive for name of each id
function validAirportPlace() {
    var valid = ["ChIJm8Wz-sPLj4ARPn72bT9E-rw", "ChIJybx_mpXLj4ARTo8TPGOw-bY", "ChIJU7sQ6-rLj4ARFcjeauLjF3A",
        "ChIJJbnd98DLj4ARnLWlNvkZ1jI", "ChIJ5wkY0JXLj4AR4yF_zytyXvs", "ChIJoR7aAZfLj4AR-7b2EMStvE8",
        "ChIJh7we-cDLj4ARwFUYEHuH6rw", "ChIJ4Xj0hpbLj4AR_Qf9DzSCHVQ", "ChIJyRLmLcDLj4ARMKyoKkBXzV4",
        "ChIJVVVVVYx3j4ARP-3NGldc8qQ", "ChIJV2Q04pN3j4ARu9rOcaf5UjU", "ChIJUd3-8JB3j4ARZePhlvmYnvc",
        "ChIJnS-7y5J3j4AR6Qg6UFa9NGE", "ChIJbbaCeJF3j4ARo5zcvfJQ4es", "ChIJ55z15yp4j4ARoVWFukbgzwo",
        "ChIJbZs2Iy14j4ARbN3n5O9iFK8", "ChIJAwAv_cx5j4ARlXfukuZqOQE", "ChIJTZ0XOSt4j4ARnuPuVs1AH6Y",
        "ChIJVVVVVYx3j4ARyN7qnq2JceQ", "ChIJQabAAlSEj4ARYHQBAw8MY7A", "ChIJu0En3QSFj4ARx_cFCHMV6z0",
        "ChIJLd7if6GFj4ARiHWhAH2cTaU", "ChIJYb6-0gSFj4ARADjUgrDzB8k", "ChIJn4zqsQaFj4ARnTOR7vEnmcA",
        "ChIJCQq50rWFj4AR4bo5FthEzXU", "ChIJY0qG2giFj4ARtshexOmLHO4"
    ];
    return valid;
}

// function testGeocode(placeId) {
//     var position = {};
//     console.log("testing geocode post");
//     $.ajax({
//         url: 'https://maps.googleapis.com/maps/api/geocode/json?place_id=' + placeId + '&key=AIzaSyDNIMuefOw8IFBBjGifWHAMMuSKOC7epj0',
//         //type: 'POST',
//         success: function(result, status) {
//             position[0] = result.results[0].geometry.location.lat;
//             position[1] = result.results[0].geometry.location.lng;
//         }
//     });
//     return position;
// }

// function getLatLongFromPlace(placeid) {
//     //array to store the latitude and longitude
//     var loc = [];
//     // create a new Geocoder object
//     var geocoder = new google.maps.Geocoder();
//     geocoder.geocode({
//         'placeId': placeid
//     }, function(results, status) {
//         // and this is function which processes response
//         if (status == google.maps.GeocoderStatus.OK) {
//             loc[0] = results[0].geometry.location.lat();
//             loc[1] = results[0].geometry.location.lng();
//             return loc;
//         } else {
//             alert("Geocode was not successful for the following reason: " + status);
//         }
//     });
// }

function details(origin_PlaceId, destination_PlaceId) {
    var formData = {};
    var directionsService = new google.maps.DirectionsService();
    var directionsRequest = {
        origin: {
            placeId: origin_PlaceId
        },
        destination: {
            placeId: destination_PlaceId
        },
        travelMode: "DRIVING"
    }

    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'placeId': origin_PlaceId
    }, function(results, status) {
        // and this is function which processes response
        if (status == google.maps.GeocoderStatus.OK) {
            formData["latOrigin"] = results[0].geometry.location.lat();
            formData["lngOrigin"] = results[0].geometry.location.lng();
        } else {
            alert("Geocode was not successful for the following reason: " + status);
        }
    });
    geocoder.geocode({
        'placeId': destination_PlaceId
    }, function(results, status) {
        // and this is function which processes response
        if (status == google.maps.GeocoderStatus.OK) {
            formData["latDestination"] = results[0].geometry.location.lat();
            formData["lngDestination"] = results[0].geometry.location.lng();
        } else {
            alert("Geocode was not successful for the following reason: " + status);
        }
    });


    directionsService.route(directionsRequest, function(response, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            // formData["originPlaceId"] = response.request.origin.placeId;
            // formData["destinationPlaceId"] = response.request.destination.placeId;
            formData["distance"] = (response.routes["0"].legs["0"].distance.value / 1609.34).toFixed(1);
            formData["duration"] = (response.routes["0"].legs["0"].duration.value / 60).toFixed(0);

        } else {
            alert("Geocode was not successful for the following reason: " + status);
        }
    });
    return formData;
}

var map;
var markers = [];
// Chose not to include 3rd party styles for map. Default looks the best!
// this function randomColor and array colors together make the markers color randomly everytime the map is loaded
var colors = ['red', 'blue', 'green', 'yellow'];
var randomColor = function() {
    return (Math.floor(Math.random() * 4));
};
var color = colors[randomColor()];

// I could also use forSquare api to get lat lng but decided to go with hard coded locations anyway. No issue right?
var locations = [{
        "title": "The Willow Cafe",
        "location": {
            "lat": 30.754633909942847,
            "lng": 76.78752422332764
        },
        "fsID": "4c09187a7e3fc928b451f182"
    },

    {
        "title": "Barbeque Nation",

        "location": {
            "lat": 30.725617009259956,
            "lng": 76.8051607298127
        },
        "fsID": "4bbf61eef353d13a29837e10"

    },

    {
        "title": "BackPacker's",
        "location": {
            "lat": 30.74747592964822,
            "lng": 76.7932741108647
        },
        "fsID": "4ba37b0ff964a520b94038e3"
    },

    {
        "title": "Nik's Bakers",
        "location": {
            "lat": 30.721652544330336,
            "lng": 76.7604983606678
        },
        "fsID": "4bd6f81229eb9c7429e295e1"

    },

    {
        "title": "Girl In The Café",
        "location": {
            "lat": 30.7378424303184,
            "lng": 76.78441192734937
        },
        "fsID": "4d822ef6baf9a35d1fc8a421"


    }

];
console.log("Script running");


// Here comes teh model
//Initializing Google Maps

//Kept map out of binding
function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 30.7333,
            lng: 76.7794
        },
        zoom: 13
    });
    //Adds auto complete functionality
    var searchAutoComplete = new google.maps.places.Autocomplete(document.getElementById("inputArea"));
    searchAutoComplete.bindTo('bounds', map);
    ko.applyBindings(new viewModel());
}
// Aaand here it ends



//Here goes the viewModel
var viewModel = function() {
    var polygon = null;
    var that = this;
    this.ratings = ko.observable('Ratings');
    this.imageSRC = ko.observable('images/placeholder.jpg');
    this.pricing = ko.observable('Prices');
    this.Timings = ko.observable('Timings');
    this.Title = ko.observable('Food Joint');
    //user input from the search bar
    this.check = ko.observable('');

    var largeInfoWindow = new google.maps.InfoWindow();

    // Initializing drawing manager and setting the values to draw a polygon
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
            // Toolbox appears at top right
            position: google.maps.ControlPosition.TOP_RIGHT,
            drawingModes: [
                google.maps.drawing.OverlayType.POLYGON
            ]
        }
    });
    //Constructing markers and pushing em in the markers array
    for (var i = 0; i < locations.length; i++) {
        var position = locations[i].location;
        var title = locations[i].title;
        var placeID = locations[i].fsID;
        var marker = new google.maps.Marker({
            id: placeID,
            position: position,
            title: title,
            visibility: ko.observable(true),
            animation: google.maps.Animation.DROP,
            imageSRC: " ",
            ratings: " ",
            pricing: " ",
            Address: " ",
            Timings: " "
        });
        marker.setMap(map);
        markers.push(marker);
}
        // I would add   imageInfoWindow: " " in app.js: 129 for displaying photo in infoWindow
        //Random markers ! Took a guess and it worked out perfectly!
        // here colors is an array of 4 colors and randomColor() function returns a value between 1 and 4 randomly. - defined at the top
        var color;
        markers.forEach(function(marker){
          color = colors[randomColor()];
        marker.setIcon('http://maps.google.com/mapfiles/ms/icons/' + color + '-dot.png');
        // Adding animations to the markers once they're clicked, ends after 2 bounces
        marker.addListener('click', function() {
            var that = this;
            this.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                that.setAnimation(null);
            }, 1450);
        });
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfoWindow);
        });
      });




    // ForSquare API   (its FourSquare but im calling it ForSquare)       -       -             -
    markers.forEach(function(marker) {
        $.ajax({
            method: "GET",
            dataType: "json",
            url: "https://api.foursquare.com/v2/venues/" + marker.id + "?client_id=QEUPZN5FFE0X4XOAIFAFVSMVZFBY01WXYNKFDG3A5L2AK2E3&client_secret=LWWKQVREUFXYDD2MZZ3110MSD5CA3SNRNCKGMGPPV2OTFHZ0&v=20171405",
            success: function(response) {
                // Console logged response and mined all the info i needed.
                marker.ratings = response.response.venue.rating;
                marker.pricing = response.response.venue.price.message;
                marker.imageSRC = response.response.venue.bestPhoto.prefix + "800x600" + response.response.venue.bestPhoto.suffix;
                // marker.imageInfoWindow = response.response.venue.bestPhoto.prefix + "100x100" + response.response.venue.bestPhoto.suffix;
                marker.Timings = response.response.venue.popular.timeframes[0].open[0].renderedTime;

            },
            error: function(){alert("Error while fetching data from server. Please check your connection and try again later.");}
        });

    });
    //   -          -           -
    //Function to display all markers
    this.showEm = function(x) {
      markers.forEach(function(marker){
        marker.visibility(x);
            marker.setVisible(x);
      });

    };
    // This function is triggered when the user clicks on the list of the food joints i spent 2 hours making
    this.selectDatMarker = function(marker) {
        populateInfoWindow(marker, largeInfoWindow);
        marker.selected = true;
        marker.visibility(true);
        marker.setVisible(true);
        marker.setMap(map);
        that.ratings(marker.ratings);
        that.imageSRC(marker.imageSRC);
        that.pricing(marker.pricing);
        that.Timings(marker.Timings);
        that.Title(marker.title);
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            marker.setAnimation(null);
        }, 1450);


    };

    //Part of filterLIst
    var res;
    var checkEXP;
    // Filters the list of locations and add/hide markers respectively
    this.filterList = function(Infowindow) {
        if (that.check().length === 0) {
            that.showEm(true);
        } else {
            checkEXP = new RegExp(that.check(), 'ig'); // using regular expression concept here , got a little help from stack overflow about how to pass an variable into match function
            for (var i = 0; i < markers.length; i++) {
                res = markers[i].title.match(checkEXP);
                if (res !== null) {
                    markers[i].visibility(true);
                    markers[i].setVisible(true);
                } else {
                    markers[i].visibility(false);
                    markers[i].setVisible(false);
                }
            }
        }
    };
    // Triggered once the user types something in the search bar (or doesn't)
    // Focuses the map on the location user entered and returns exact location in text in jumbotron div(index.html)

    // refers to jumbotron below search area
    this.addressDetailed = ko.observable('See full address of your search here.');

    // "check" here refers to user input (app.js:71)
    this.findArea = function() {
        console.log("Search triggered");
        //Using geocoder API
        var geocoder = new google.maps.Geocoder();
        if (that.check().length === 0) {
            window.alert("Enter an area or an address");
        } else {
            geocoder.geocode({
                address: that.check()
            }, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    console.log(results);
                    map.setCenter(results[0].geometry.location);
                    map.setZoom(15);
                    //
                    that.addressDetailed(results[0].formatted_address);
                } else {
                    window.alert("We couldn't find the location. Please make sure you enter a valid address");
                }
            });
        }
    };
    // Adding info to infoWindow
    function populateInfoWindow(marker, infowindow) {
        //Reduced unnecessary digits from latitude and longitude no one cares about
        var lan = Number((marker.position.lat()).toFixed(3)),
            lng = Number((marker.position.lng()).toFixed(3));

        infowindow.marker = marker;
        infowindow.setContent('<h1>' + marker.title + '</h1>' + '<p>Lat:' + lan + '</p><p>Lng:' + lng + '</p><p> Ratings :' +marker.ratings+ '</p><p>Prices :'+marker.pricing+'</p><p>Timings :' +marker.Timings+'</p>' ); // I could add image by adding +'<img src=" ' +marker.imageInfoWindow+' " >' but can i please not?
        infowindow.open(map, marker);

    }
    this.toggleDrawing = function() {
        if (drawingManager.map) {
            drawingManager.setMap(null);
            // Removes the drawn polygon once user closes the drawing tools
            if (polygon) {
                polygon.setMap(null);
            }
        } else {
            drawingManager.setMap(map);
        }
    };

    // Shows markers inside the polygon and hides the markers that are outside the drawn polygon
    var searchInsidePolygon = function() {
        for (var i = 0; i < markers.length; i++) {
            if (google.maps.geometry.poly.containsLocation(markers[i].position, polygon)) {
                markers[i].setMap(map);
            } else {
                markers[i].setMap(null);
            }
        }
    };
    //Manages what happens once a polygon is drawn
    drawingManager.addListener('overlaycomplete', function(event) {
        if (polygon) {
            polygon.setMap(null);
            hideListings();
        }
        //Switches off drawing mode once a drawing is done
        drawingManager.setDrawingMode(null);
        polygon = event.overlay;

        polygon.setEditable(true);
        polygon.setDraggable(true);

        polygon.type = event.type;
        // Shows markers(if any) inside the shape user makes and drags around or alters
        //  Took some help from Stack Overflow! :P
        google.maps.event.addListener(polygon, 'click', function() {
            google.maps.event.addListener(polygon.getPath(), 'set_at', function() {
                searchInsidePolygon();
            });

            google.maps.event.addListener(polygon.getPath(), 'insert_at', function() {
                searchInsidePolygon();
            });

        });


    });
    // Toggles the markers on : adds the markers
    this.showListings = function() {
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < markers.length; i++) {
            markers[i].animation = google.maps.Animation.DROP;
            markers[i].setMap(map);
            bounds.extend(markers[i].position);

        }
        map.fitBounds(bounds);
    };

    // Toggles the markers off : removes the markers
    this.hideListings = function() {

        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);

        }
    };

};

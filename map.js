var map;
var markers = [];
var current_place = null;
var CLIENT_ID = 'APUW500ZFFFLYB41YV1IOBRT0H4KKJGHD2SRBKZAWPXRXK0N';
var CLIENT_SECRET = 'O1GMDQV3SSPSRE5XWDMT0NCFKGZCV0AAMY4OWNJ3O3JR5K3T';
var SEARCH_ENDPOINT = 'https://api.foursquare.com/v2/venues/search';
var locations = {
    'Park Ave Penthouse': {
        location: {
            lat: 40.7713024,
            lng: -73.9632393
        }
    },
    'Chelsea Loft': {
        location: {
            lat: 40.7444883,
            lng: -73.9949465
        }
    },
    'Union Square Open Floor Plan': {
        location: {
            lat: 40.7347062,
            lng: -73.9895759
        }
    },
    'East Village Hip Studio': {
        location: {
            lat: 40.7281777,
            lng: -73.984377
        }
    },
    'TriBeCa Artsy Bachelor Pad': {
        location: {
            lat: 40.7195264,
            lng: -74.0089934
        }
    },
    'Chinatown Homey Space': {
        location: {
            lat: 40.7180628,
            lng: -73.9961237
        }
    }
};


function ListItem(name, lat, lng) {
    var self = this;
    self.name = name;
    self.lat = lat;
    self.lng = lng;
}

function searched_venue(name, address, url, contact) {
    var self = this;
    if (name)
        self.name = name;
    if (address)
        self.address = "http://maps.google.com/?q="+address;
    else
        self.address = 'Address for the place is not available';
    if (url)
        self.url = url;
    else
        self.url = 'Link to website is not available';

    if (contact)
        self.contact = contact;
    else
        self.contact = 'No Contact infomation available';
}

function AppViewModel() {
    var self = this;
    self.map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 40.7413549,
            lng: -73.9980244
        },
        zoom: 12,
        mapTypeControl: false
    });
    self.infowindow = new google.maps.InfoWindow();

    /*
        Map related functions 
    */

    //Initializes the map
    self.initMap = function() {

        var defaultIcon = self.makeMarkerIcon('0091ff');

        // Create a "highlighted location" marker color for when the user
        // mouses over the marker.
        var highlightedIcon = self.makeMarkerIcon('FFFF24');
        //Add markers
        var bounds = new google.maps.LatLngBounds();
        for (lo in locations) {
            // Get the position from the location array.
            var position = locations[lo].location;
            var title = lo;
            // Create a marker per location, and put into markers array.
            var marker = new google.maps.Marker({
                position: position,
                map: self.map,
                title: title,
                animation: google.maps.Animation.DROP,
                id: lo,
                icon: defaultIcon,
            });
            // Push the marker to our array of markers.

            bounds.extend(marker.position);
            marker.addListener('click', function() {
                self.add_info_window_on_marker(this, self.infowindow);
            });
            marker.addListener('mouseover', function() {
                this.setIcon(highlightedIcon);
            });
            marker.addListener('mouseout', function() {
                this.setIcon(defaultIcon);
            });
            markers.push(marker);
        }
        self.map.fitBounds(bounds);

    }
    //Styling function - creates a marker of particular color
    self.makeMarkerIcon = function(markerColor) {
        var markerImage = new google.maps.MarkerImage(
            'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
            '|40|_|%E2%80%A2',
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34),
            new google.maps.Size(21, 34));
        return markerImage;
    }
    //Styling function - creates BOUNCE animtion on selected marker
    self.set_animation_on_marker = function(marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        window.setTimeout(function() {
            marker.setAnimation(null);
        }, 750);
    }

    //Utility function - calls various function, to provide interaction with the marker
    //pan_map_on_marker
    //set_animation on marker
    //add_info_window_on_marker
    self.focus_clicked_marker = function() {
        for (marker in markers) {
            if (this.name === markers[marker].title) {
                self.pan_map_on_marker(markers[marker]);
                self.set_animation_on_marker(markers[marker]);
                self.add_info_window_on_marker(markers[marker], self.infowindow);
                break;
            }
        }
    }

    //Moves the focus of the map to the clicked marker
    self.pan_map_on_marker = function(marker) {
        // console.log(marker);
        var latitude = marker.position.lat();
        var longitude = marker.position.lng();
        var latlng = new google.maps.LatLng(latitude, longitude);
        self.map.panTo(latlng);
    }
    //Adds infowindow on the marker, with streetview panorama
    self.add_info_window_on_marker = function(marker, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
            // Clear the infowindow content to give the streetview time to load.
            infowindow.setContent('');
            infowindow.marker = marker;
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });
            var streetViewService = new google.maps.StreetViewService();
            var radius = 50;
            // In case the status is OK, which means the pano was found, compute the
            // position of the streetview image, then calculate the heading, then get a
            // panorama from that and set the options
            function getStreetView(data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    var nearStreetViewLocation = data.location.latLng;
                    var heading = google.maps.geometry.spherical.computeHeading(
                        nearStreetViewLocation, marker.position);
                    infowindow.setContent('<div>' + marker.title + `</div><div id="small_pano"></div>`);
                    var panoramaOptions = {
                        position: nearStreetViewLocation,
                        pov: {
                            heading: heading,
                            pitch: 30
                        }
                    };
                    var panorama = new google.maps.StreetViewPanorama(
                        document.getElementById('small_pano'), panoramaOptions);
                } else {
                    infowindow.setContent('<div>' + marker.title + '</div>' +
                        '<div>No Street View Found</div>');
                }
            }
            streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
            infowindow.open(self.map, marker);
        }
    }

    /*
        List related functions
    */

    self.place_list = ko.observableArray([]);
    self.marker_list = ko.observableArray([]);
    self.query = ko.observable('');

    //Finds the places names which have user entered string as substring
    //Calls show_markers
    self.places_list_len = ko.computed(function(){
        return self.marker_list().length == 0;
    })
    self.filter_list = function() {
        self.place_list.removeAll();
        self.marker_list.removeAll();
        for (i in markers) {
            var title = markers[i].title.toLowerCase();
            self.query(document.getElementById('search_query').value);
            if (title.indexOf(self.query()) !== -1) {
                var name = markers[i].title;
                var lat = markers[i].position.lat();
                var lng = markers[i].position.lng();
                self.place_list.push(new ListItem(name, lat, lng));
                self.marker_list.push(markers[i]);
            }
        }
        self.show_markers();
    }
    //Shows markers matching user query
    self.show_markers = function() {
        for (i in markers) {
            if (self.marker_list().length == 0 || self.marker_list.indexOf(markers[i]) < 0 ) {
                markers[i].setMap(null);
                if (self.infowindow.marker == markers[i]) {
                    self.infowindow.close();
                }
            } else
                markers[i].setMap(self.map);
        }
    }

    /*
    Overlay related functions
    */

    //Opens the overlay window
    //Also calls fill overlay function
    self.openNav = function(title) {
        current_place = this;
        self.filloverlay();
        document.getElementById("myNav").style.width = "100%";
    }

    //Close overlay window
    self.closeNav = function() {
        $('#query-table').hide();
        document.getElementById("myNav").style.width = "0%";
    }

    self.overlayTitle = ko.computed(function() {
        if (current_place)
            return current_place.name;
    })
    //Fills the overlay with info about the place, like title, street panorama
    self.filloverlay = function() {
        if (!current_place)
            return;
        var position = new google.maps.LatLng(current_place.lat, current_place.lng);
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;

        function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, position);
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 30
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('panorama'), panoramaOptions);
            } else {
                document.getElementById('panorama').innerHTML = "<h1>No Street Preview Found</h1>";
            }
        }
        streetViewService.getPanoramaByLocation(position, radius, getStreetView);
    }

    //Make query to FOURSQUARE API
    //Using current_markers position as the basis, it returns JSON object
    //Having places of interest related to the input query.
    //Also calls find_distance_to_venues
    self.make_venues_query = function() {

        var lat = current_place.lat;
        var lng = current_place.lng;
        var query = document.getElementById('query').value;
        var params = {
            ll: `${lat},${lng}`,
            query: query,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            v: '20171102'
        }
        $.ajax({
            url: SEARCH_ENDPOINT,
            type: 'get',
            data: params,
            success: function(response) {
                console.log(response.response.venues);
                if(response.response.venues.length > 0)
                    self.find_distance_to_venues(response.response.venues);
                else
                    window.alert("No Venue Found");
            },
            error: function (jqXHR, exception) {
                var msg = '';
                if (jqXHR.status === 0) {
                    msg = 'Not connect.\n Verify Network.';
                } else if (jqXHR.status == 404) {
                    msg = 'Requested page not found. [404]';
                } else if (jqXHR.status == 500) {
                    msg = 'Internal Server Error [500].';
                } else if (exception === 'parsererror') {
                    msg = 'Requested JSON parse failed.';
                } else if (exception === 'timeout') {
                    msg = 'Time out error.';
                } else if (exception === 'abort') {
                    msg = 'Ajax request aborted.';
                } else {
                    msg = 'Uncaught Error.\n' + jqXHR.responseText;
                }
                window.alert(msg);
            },
        });
    }

    //Uses distancematrixservice and finds duration of travel
    //via the user entered mode of transport
    //then calls display_venues_within_duration
    self.find_distance_to_venues = function(venues) {
        if (!current_place)
            return;
        var distanceMatrixService = new google.maps.DistanceMatrixService;
        //maximum query limit allowed is foir 25 places only
        if (venues.length > 25) {
            venues = venues.slice(1, 20);
        }
        var destination = new google.maps.LatLng(current_place.lat, current_place.lng);
        var origins = [];
        for (i in venues) {
            var venue = venues[i];
            var lat = venue.location.lat;
            var lng = venue.location.lng;
            // console.log(lat, lng);
            origins.push(new google.maps.LatLng(parseFloat(lat), parseFloat(lng)));
        }
        var mode = document.getElementById('mode').value;
        distanceMatrixService.getDistanceMatrix({
                origins: origins,
                destinations: [destination],
                travelMode: google.maps.TravelMode[mode],
                unitSystem: google.maps.UnitSystem.IMPERIAL,
            },
            function(response, status) {
                if (status !== google.maps.DistanceMatrixStatus.OK) {
                    window.alert('Error was: ' + status);
                } else {
                    self.display_venues_within_duration(response, venues);
                }
            }
        );
    }

    //Displays the venues which satisfies the conditions entered by the user
    //Info is displayed in the form of table
    self.searched_venue_list = ko.observableArray([]);
    self.display_venues_within_duration = function(response, venues) {
        var maxDuration = document.getElementById('max-duration').value;
        var origins = response.originAddresses;
        var destinations = response.destinationAddresses;
        var atLeastOne = false;
        var query_table_body = document.getElementById('query_table_body');
        self.searched_venue_list.removeAll();
        for (var i = 0; i < origins.length; i++) {
            var venue = venues[i];
            var results = response.rows[i].elements;
            for (var j = 0; j < results.length; j++) {
                var element = results[j];
                if (element.status === "OK") {
                    var distanceText = element.distance.text;
                    var duration = element.duration.value / 60;
                    var durationText = element.duration.text;
                    if (duration <= maxDuration) {
                        self.searched_venue_list.push(new searched_venue(venue.name, venue.location.address, venue.url, venue.contact.formattedPhone))
                        atLeastOne = true;
                    }
                }
            }
        }
        if (!atLeastOne) {
            window.alert('We could not find any locations within that distance!');
        } else {
            $('#query-table').show();
        }
    }

}

function startUp() {
    var avm = new AppViewModel();
    ko.applyBindings(avm);
    avm.initMap();
    avm.filter_list();
};
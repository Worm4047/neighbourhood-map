var map = null;
var markers = [];
var currentPlace = null;
var CLIENT_ID = 'APUW500ZFFFLYB41YV1IOBRT0H4KKJGHD2SRBKZAWPXRXK0N';
var CLIENT_SECRET = 'O1GMDQV3SSPSRE5XWDMT0NCFKGZCV0AAMY4OWNJ3O3JR5K3T';
var FS_SEARCH_ENDPOINT = 'https://api.foursquare.com/v2/venues/search';
var WIKI_SEARCH_ENDPOINT = 'http://nominatim.openstreetmap.org/reverse';
var locations = [{
        title: 'Park Ave Penthouse',
        location: {
            lat: 40.7713024,
            lng: -73.9632393
        }
    },
    {
        title: 'Chelsea Loft',
        location: {
            lat: 40.7444883,
            lng: -73.9949465
        }
    },
    {
        title: 'Union Square Open Floor Plan',
        location: {
            lat: 40.7347062,
            lng: -73.9895759
        }
    },
    {
        title: 'East Village Hip Studio',
        location: {
            lat: 40.7281777,
            lng: -73.984377
        }
    },
    {
        title: 'TriBeCa Artsy Bachelor Pad',
        location: {
            lat: 40.7195264,
            lng: -74.0089934
        }
    },
    {
        title: 'Chinatown Homey Space',
        location: {
            lat: 40.7180628,
            lng: -73.9961237
        }
    }
];


function ListItem(name, lat, lng) {
    var self = this;
    self.name = name;
    self.lat = lat;
    self.lng = lng;
}

function searchedVenue(name, address, url, contact) {
    var self = this;
    if (name)
        self.name = name;
    if (address)
        self.address = "http://maps.google.com/?q=" + address;
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
    };

    self.infowindow = new google.maps.InfoWindow();
    self.defaultIcon = self.makeMarkerIcon('0091ff');
    self.highlightedIcon = self.makeMarkerIcon('FFFF24');
    /*
        Map related functions 
    */
    self.markerFunc1 = function() {
        self.addInfoWindowOnMarker(this, self.infowindow);
        self.setAnimationOnMarker(this);
    };
    self.markerFunc2 = function() {
        this.setIcon(self.highlightedIcon);
    };
    self.markerFunc3 = function() {
        this.setIcon(self.defaultIcon);
    };

    //Initializes the map
    self.initMap = function() {

        //Add markers
        var bounds = new google.maps.LatLngBounds();
        for (var lo = 0; lo < locations.length; lo++) {
            // Get the position from the location array.
            var position = locations[lo].location;
            var title = locations[lo].title;
            // Create a marker per location, and put into markers array.
            var marker = new google.maps.Marker({
                position: position,
                map: self.map,
                title: title,
                animation: google.maps.Animation.DROP,
                id: lo,
                icon: self.defaultIcon,
            });
            // Push the marker to our array of markers.

            bounds.extend(marker.position);
            marker.addListener('click', self.markerFunc1);
            marker.addListener('mouseover', self.markerFunc2);
            marker.addListener('mouseout', self.markerFunc3);
            markers.push(marker);
        }
        self.map.fitBounds(bounds);
    };

    //Styling function - creates BOUNCE animtion on selected marker
    self.setAnimationOnMarker = function(marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        window.setTimeout(function() {
            marker.setAnimation(null);
        }, 2000);
    };

    //Utility function - calls various function, to provide interaction with the marker
    //panMapOnMarker
    //set_animation on marker
    //addInfoWindowOnMarker
    self.focusClickedMarker = function() {
        for (var i = 0; i < markers.length; i++) {
            if (this.name === markers[i].title) {
                self.panMapOnMarker(markers[i]);
                self.setAnimationOnMarker(markers[i]);
                self.addInfoWindowOnMarker(markers[i], self.infowindow);
                break;
            }
        }
    };

    //Moves the focus of the map to the clicked marker
    self.panMapOnMarker = function(marker) {
        // console.log(marker);
        var latitude = marker.position.lat();
        var longitude = marker.position.lng();
        var latlng = new google.maps.LatLng(latitude, longitude);
        self.map.panTo(latlng);
    };
    //Adds infowindow on the marker, with streetview panorama
    self.placeTitle = ko.observable('');
    self.addInfoWindowOnMarker = function(marker, infowindow) {
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
            var address = '';
            var list = '';
            // In case the status is OK, which means the pano was found, compute the
            // position of the streetview image, then calculate the heading, then get a
            // panorama from that and set the options
            var getStreetView = function(data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    var nearStreetViewLocation = data.location.latLng;
                    var heading = google.maps.geometry.spherical.computeHeading(
                        nearStreetViewLocation, marker.position);
                    infowindow.setContent('<h2 >' + marker.title + '</h2><div id="small_pano"></div><h3>Place Info</h3>' + list);
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
            };

            var params = {
                lat: marker.position.lat(),
                lon: marker.position.lng(),
                format: 'json',
                addressdetails: '1',

            };
            $.ajax({
                url: WIKI_SEARCH_ENDPOINT,
                data: params,
                success: function(response) {
                    console.log(response);
                    self.placeTitle(response.display_name);
                    address = response.address;
                    list = '<ul class="list-group"><li class="list-group-item"><b>Road</b> : ' + address.road + '</li><li class="list-group-item"><b>Postal Code </b>: ' + address.postcode + '</li><li class="list-group-item"><b>County</b> : ' + address.county + '</li></ul>';
                    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
                    infowindow.open(self.map, marker);
                },
                error: errorHandler
            });

        }
    };

    /*
        List related functions
    */

    self.placeList = ko.observableArray([]);
    self.markerList = ko.observableArray([]);
    self.query = ko.observable('');

    //Finds the places names which have user entered string as substring
    //Calls showMarkers
    self.places_list_len = ko.computed(function() {
        return self.markerList().length === 0;
    });
    self.filterList = function() {
        self.placeList.removeAll();
        self.markerList.removeAll();
        for (var i = 0; i < markers.length; i++) {
            var title = markers[i].title.toLowerCase();
            if (title.indexOf(self.query()) !== -1) {
                var name = markers[i].title;
                var lat = markers[i].position.lat();
                var lng = markers[i].position.lng();
                self.placeList.push(new ListItem(name, lat, lng));
                self.markerList.push(markers[i]);
            }
        }
        self.showMarkers();
    };
    //Shows markers matching user query
    self.showMarkers = function() {
        for (var i = 0; i < markers.length; i++) {
            if (self.markerList().length === 0 || self.markerList.indexOf(markers[i]) < 0) {
                markers[i].setMap(null);
                if (self.infowindow.marker == markers[i]) {
                    self.infowindow.close();
                }
            } else
                markers[i].setMap(self.map);
        }
    };

    /*
    Overlay related functions
    */

    //Opens the overlay window
    //Also calls fill overlay function
    self.openNav = function() {
        currentPlace = this;
        self.fillOverlay();
        document.getElementById("myNav").style.width = "100%";
    };

    //Close overlay window
    self.closeNav = function() {
        $('#query-table').hide();
        document.getElementById("myNav").style.width = "0%";
    };

    self.overlayTitle = ko.computed(function() {
        if (currentPlace)
            return currentPlace.name;
    });
    //Fills the overlay with info about the place, like title, street panorama
    self.fillOverlay = function() {
        if (!currentPlace)
            return;
        var position = new google.maps.LatLng(currentPlace.lat, currentPlace.lng);
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
    };

    //Make query to FOURSQUARE API
    //Using current_markers position as the basis, it returns JSON object
    //Having places of interest related to the input query.
    //Also calls findDistanceToVenues
    self.selectedVenue = ko.observable();
    self.selectedDuration = ko.observable();
    self.selectedMode = ko.observable();
    self.makeVenuesQuery = function() {

        var lat = currentPlace.lat;
        var lng = currentPlace.lng;
        var query = self.selectedVenue();

        var params = {
            ll: lat + ',' + lng,
            query: query,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            v: '20171102'
        };
        var promise = self.makeQuery(params);
        console.log(promise);
        promise.then(function(response) {
            if (response.response.venues.length > 0)
                self.findDistanceToVenues(response.response.venues);
            else
                window.alert("No Venue Found");
        }).catch(errorHandler);

    };
    self.makeQuery = function(params) {
        return $.ajax({
            url: FS_SEARCH_ENDPOINT,
            type: 'get',
            data: params,
            success: function(response) {
                return response;
            },
            error: errorHandler,
        });
    };
    //Uses distancematrixservice and finds duration of travel
    //via the user entered mode of transport
    //then calls displayVenuesWithinDuration
    self.findDistanceToVenues = function(venues) {
        if (!currentPlace)
            return;
        var distanceMatrixService = new google.maps.DistanceMatrixService();
        //maximum query limit allowed is foir 25 places only
        if (venues.length > 25) {
            venues = venues.slice(1, 20);
        }
        var destination = new google.maps.LatLng(currentPlace.lat, currentPlace.lng);
        var origins = [];
        for (var i = 0; i < venues.length; i++) {
            var venue = venues[i];
            var lat = venue.location.lat;
            var lng = venue.location.lng;
            // console.log(lat, lng);
            origins.push(new google.maps.LatLng(parseFloat(lat), parseFloat(lng)));
        }
        var mode = self.selectedMode();
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
                    self.displayVenuesWithinDuration(response, venues);
                }
            }
        );
    };

    //Displays the venues which satisfies the conditions entered by the user
    //Info is displayed in the form of table
    self.searchedVenueList = ko.observableArray([]);
    self.showTable = ko.observable(false);
    self.displayVenuesWithinDuration = function(response, venues) {
        var maxDuration = self.selectedDuration();
        var origins = response.originAddresses;
        var destinations = response.destinationAddresses;
        var atLeastOne = false;
        var query_table_body = document.getElementById('query_table_body');
        self.searchedVenueList.removeAll();
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
                        self.searchedVenueList.push(new searchedVenue(venue.name, venue.location.address, venue.url, venue.contact.formattedPhone));
                        atLeastOne = true;
                    }
                }
            }
        }
        if (!atLeastOne) {
            window.alert('We could not find any locations within that distance!');
        } else {
            self.showTable(true);
        }
    };

}

function startUp() {
    var avm = new AppViewModel();
    ko.applyBindings(avm);
    avm.initMap();
    avm.filterList();
}

function mapError() {
    window.alert('Google Maps Api Failed to load !!');
}

function errorHandler(jqXHR, exception) {
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
}
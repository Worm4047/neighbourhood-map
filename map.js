var map;
var markers = [];
var current_marker = null;
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

/*
Map related functions 
*/
function AppViewModel(){
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
    //Initializes the map
    self.initMap = function () {
            
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

            //Various event listeners are added
            document.getElementById('search-query').addEventListener('keyup', function() {
                search_list(self.infowindow);
            });
            $('.list-group').on('click', '.place_name', function() {
                console.log($(this));
                var li = $(this)[0].innerText;
                self.focus_clicked_marker(li, self.infowindow);
            });
            $('.list-group').on('click', '.view-place-info', function() {
                var row = $(this).parent().parent();
                var clicked_li = row[0].firstChild.innerText;
                openNav(clicked_li);
            });
            $('#search-within-time').click(function() {
                make_venues_query(current_marker);
            })

    }
    //Styling function - creates a marker of particular color
    self.makeMarkerIcon = function (markerColor) {
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
    self.set_animation_on_marker = function (marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        window.setTimeout(function() {
            marker.setAnimation(null);
        }, 750);
    }

    //Utility function - calls various function, to provide interaction with the marker
    //pan_map_on_marker
    //set_aniamtion on marker
    //add_info_window_on_marker
    self.focus_clicked_marker =  function(clicked_title, infowindow) {
        // console.log('Clicked');
        for (marker in markers) {
            var title = markers[marker].title;
            if (title.toLowerCase() === clicked_title.toLowerCase()) {
                // console.log(markers[marker]);
                self.pan_map_on_marker(markers[marker]);
                self.set_animation_on_marker(markers[marker]);
                self.add_info_window_on_marker(markers[marker], infowindow);
                break;
            }
        }
    }

    //Moves the focus of the map to the clicked marker
    self.pan_map_on_marker = function (marker) {
        // console.log(marker);
        var latitude = marker.position.lat();
        var longitude = marker.position.lng();
        var latlng = new google.maps.LatLng(latitude, longitude);
        console.log(latlng);
        self.map.panTo(latlng);
    }

    //Adds infowindow on the marker, with streetview panorama
    self.add_info_window_on_marker = function (marker, infowindow) {
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
                    infowindow.setContent('<div>' + marker.title + `</div><div id="small_pano"></div><a href="javascript:void(0)" class="view_detail" onclick="openNav('${marker.title}')">View Details</a>`);
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
}

function startUp(){
    var avm = new AppViewModel();
    ko.applyBindings(avm);
    avm.initMap();
};


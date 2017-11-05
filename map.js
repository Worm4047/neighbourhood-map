var map;
var markers = [];
var current_marker = null;
var CLIENT_ID = 'APUW500ZFFFLYB41YV1IOBRT0H4KKJGHD2SRBKZAWPXRXK0N';
var CLIENT_SECRET = 'O1GMDQV3SSPSRE5XWDMT0NCFKGZCV0AAMY4OWNJ3O3JR5K3T';
var SEARCH_ENDPOINT = 'https://api.foursquare.com/v2/venues/search';




/*
Map related functions 
*/

//Initializes the map
function initMap() {
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
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 40.7413549,
            lng: -73.9980244
        },
        zoom: 12,
        mapTypeControl: false
    });
    var largeInfowindow = new google.maps.InfoWindow();
    var defaultIcon = makeMarkerIcon('0091ff');

    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('FFFF24');
    //Add markers
    var bounds = new google.maps.LatLngBounds();
    for (lo in locations) {
        // Get the position from the location array.
        var position = locations[lo].location;
        var title = lo;
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            position: position,
            map: map,
            title: title,
            animation: google.maps.Animation.DROP,
            id: lo,
            icon: defaultIcon,
        });
        // Push the marker to our array of markers.

        bounds.extend(marker.position);
        marker.addListener('click', function() {
            add_info_window_on_marker(this, largeInfowindow);
        });
        marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });
        markers.push(marker);
    }
    map.fitBounds(bounds);
    initial_populate_list();


    //Various event listeners are added
    document.getElementById('search-query').addEventListener('keyup', function() {
        search_list(largeInfowindow);
    });
    $('.list-group').on('click', '.place_name', function() {
        console.log($(this));
        var li = $(this)[0].innerText;
        focus_clicked_marker(li, largeInfowindow);
    });
    $('.list-group').on('click', '.view-place-info', function() {
        var row = $(this).parent().parent();
        var clicked_li = row[0].firstChild.innerText;
        openNav(clicked_li);
    });
    $('#search-within-time').click(function() {
        console.log(current_marker);
        make_venues_query(current_marker);
    })
    $('.view_detail').click(function() {
        console.log('Marker Clicked');
    });
}

//Styling function - creates a marker of particular color
function makeMarkerIcon(markerColor) {
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
function set_animation_on_marker(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    window.setTimeout(function() {
        marker.setAnimation(null);
    }, 750);
}

//Utility function - calls various function, to provide interaction with the marker
//pan_map_on_marker
//set_aniamtion on marker
//add_info_window_on_marker
function focus_clicked_marker(clicked_title, infowindow) {
    // console.log('Clicked');
    for (marker in markers) {
        var title = markers[marker].title;
        if (title.toLowerCase() === clicked_title.toLowerCase()) {
            // console.log(markers[marker]);
            pan_map_on_marker(markers[marker]);
            set_animation_on_marker(markers[marker]);
            add_info_window_on_marker(markers[marker], infowindow);
            break;
        }
    }
}

//Moves the focus of the map to the clicked marker
function pan_map_on_marker(marker) {
    // console.log(marker);
    var latitude = marker.position.lat();
    var longitude = marker.position.lng();
    var latlng = new google.maps.LatLng(latitude, longitude);
    console.log(latlng);
    map.panTo(latlng);
}

//Adds infowindow on the marker, with streetview panorama
function add_info_window_on_marker(marker, infowindow) {
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
        infowindow.open(map, marker);
    }
}



/*
Overlay related functions
*/

//Opens the overlay window
//Also calls fill overlay function
function openNav(title) {
    document.getElementById("myNav").style.width = "100%";
    filloverlay(title);
}

//Close overlay window
function closeNav() {
    document.getElementById("myNav").style.width = "0%";
}

//Fills the overlay with info about the place, like title, street panorama
function filloverlay(title) {
    var con = document.getElementById('content');
    document.getElementById('query_table_body').innerHTML = '';
    con.innerHTML = ''
    var h2 = document.createElement('h2');
    var div = document.createElement('div');
    div.id = "panorama";
    h2.innerHTML = title;

    con.appendChild(h2);
    con.appendChild(div);

    var marker;
    for (i in markers) {
        marker = markers[i];
        if (marker.title === title)
            break;
    }

    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;

    function getStreetView(data, status) {
        if (status == google.maps.StreetViewStatus.OK) {
            var nearStreetViewLocation = data.location.latLng;
            var heading = google.maps.geometry.spherical.computeHeading(
                nearStreetViewLocation, marker.position);
            var panoramaOptions = {
                position: nearStreetViewLocation,
                pov: {
                    heading: heading,
                    pitch: 30
                }
            };
            var panorama = new google.maps.StreetViewPanorama(
                div, panoramaOptions);
        } else {
            window.alert('No Street View Found');
        }
    }
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    current_marker = marker;
}

//Make query to FOURSQUARE API
//Using current_markers position as the basis, it returns JSON object
//Having places of interest related to the input query.
//Also calls find_distance_to_venues
function make_venues_query(marker) {

    var lat = marker.position.lat();
    var lng = marker.position.lng();
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
            find_distance_to_venues(response.response.venues, current_marker);
        },
        error: function(error) {
            console.log(error);
        }
    });
}


//Uses distancematrixservice and finds duration of travel
//via the user entered mode of transport
//then calls display_venues_within_duration
function find_distance_to_venues(venues, marker) {

    var distanceMatrixService = new google.maps.DistanceMatrixService;
    if (marker === null)
        return;
    //maximum query limit allowed is foir 25 places only
    if (venues.length > 25) {
        venues = venues.slice(1, 20);
    }
    var destination = new google.maps.LatLng(marker.position.lat(), marker.position.lng());
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
                display_venues_within_duration(response, venues);
            }
        }
    );
}

//Displays the venues which satisfies the conditions entered by the user
//Info is displayed in the form of table
function display_venues_within_duration(response, venues) {
    var maxDuration = document.getElementById('max-duration').value;
    var origins = response.originAddresses;
    var destinations = response.destinationAddresses;
    var atLeastOne = false;
    var query_table_body = document.getElementById('query_table_body');
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
                    // console.log(element);
                    var tr = document.createElement('tr');
                    var td1 = document.createElement('td');
                    td1.innerHTML = venue.name;
                    var td2 = document.createElement('td');
                    td2.innerHTML = venue.location.address;
                    var td3 = document.createElement('td');
                    td3.innerHTML = venue.contact.formattedPhone;
                    var td4 = document.createElement('td');
                    td4.innerHTML = `<a href="${venue.url}" target="_blank">Link</a>`;
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tr.appendChild(td3);
                    tr.appendChild(td4);
                    query_table_body.appendChild(tr);
                    // console.log(venue.name, venue.contact.formattedPhone, venue.location, venue.url);
                    atLeastOne = true;
                }
            }
        }
    }
    if (!atLeastOne) {
        window.alert('We could not find any locations within that distance!');
    } else {
        document.getElementById('query-table').display = 'block';
    }
}




//List functions 

//Makes a list of marker titles\
//Calls show_list
function initial_populate_list() {

    var list = []
    for (marker in markers) {
        list.push(markers[marker].title);
    }

    show_list(list);
}

//finds the places names which have user entered string as substring
//Calls show_list and show_markers
function search_list(infowindow) {
    var q = document.getElementById('search-query').value.toLowerCase();
    console.log(q);
    var list = [];
    for (marker in markers) {
        var title = markers[marker].title.toLowerCase();
        if (title.indexOf(q) !== -1)
            list.push(markers[marker].title);
    }
    show_list(list, infowindow);
    show_markers(list, infowindow);
}

//Shows places matching user query
function show_list(list, infowindow) {
    var ul = document.getElementById('list-view');
    ul.innerHTML = '';
    for (item in list) {
        var li = document.createElement('li');
        li.classList.add('list-group-item');
        li.innerHTML = '<div class="row"><div class="col-lg-8 col-md-8 col-sm-12"><p class="place_name">' + list[item] + '</p></div><div class="col-lg-4 col-md-4 col-sm-12"><button class="view-place-info btn btn-info btn-sm pull-left"  >View Details</button></div></div>';
        ul.appendChild(li);
    }
    if (list.length == 0) {
        ul.innerHTML = "No area found";
    }
}

//Shows markers matching user query
function show_markers(list, infowindow) {
    for (marker in markers) {
        var title = markers[marker].title;
        if (!list.includes(title)) {
            markers[marker].setMap(null);
            if (infowindow.marker == markers[marker]) {
                infowindow.close();
            }
        } else
            markers[marker].setMap(map);
    }
}
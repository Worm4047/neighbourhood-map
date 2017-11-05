
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
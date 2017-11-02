var map;
var markers = [];

function openNav(title) {
    document.getElementById("myNav").style.width = "100%";
    filloverlay(title);
}

/* Close when someone clicks on the "x" symbol inside the overlay */
function closeNav() {
    document.getElementById("myNav").style.width = "0%";
}

function makeMarkerIcon(markerColor) {
	var markerImage = new google.maps.MarkerImage(
	  'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
	  '|40|_|%E2%80%A2',
	  new google.maps.Size(21, 34),
	  new google.maps.Point(0, 0),
	  new google.maps.Point(10, 34),
	  new google.maps.Size(21,34));
	return markerImage;
}

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
    for (lo in locations) {
        // Get the position from the location array.
        // console.log(lo,locations[lo]);
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
    populate_list();
    document.getElementById('search-query').addEventListener('keyup', function() {
        search_list_view(largeInfowindow);
    });
    $('.list-group').on('click', '.place_name', function() {
    	console.log($(this));
        var li = $(this)[0].innerText;
        highlight_marker(li, largeInfowindow);
    });
    $('.list-group').on('click', '.view-place-info', function() {
        var row = $(this).parent().parent();
        var clicked_li = row[0].firstChild.innerText;
        openNav(clicked_li);
    });
    $('.view_detail').click(function(){
    	console.log('Marker Clicked');
    });
}



function highlight_marker(clicked_title, infowindow) {
    // console.log('Clicked');
    for (marker in markers) {
        var title = markers[marker].title;
        if (title.toLowerCase() === clicked_title.toLowerCase()) {
            // console.log(markers[marker]);
            // center_map_on_marker(marker);
            set_animation_on_marker(markers[marker]);
            add_info_window_on_marker(markers[marker], infowindow);
            break;
        }
    }
}

function center_map_on_marker(marker) {
    map.setCenter(marker.position);
    map.setZoom(13);
}

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

function filloverlay(title){
	var con = document.getElementById('content');
	con.innerHTML = ''
	var h2 = document.createElement('h2');
	var div = document.createElement('div');
	div.id = "panorama";
	h2.innerHTML = title;

	con.appendChild(h2);
	con.appendChild(div);

	var marker;
	for(i in markers){
		marker = markers[i];
		if(marker.title === title)
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

}

function set_animation_on_marker(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    window.setTimeout(function() {
        marker.setAnimation(null);
    }, 750);
}

function search_list_view(infowindow) {
    var q = document.getElementById('search-query').value.toLowerCase();
    console.log(q);
    var list = [];
    for (marker in markers) {
        var title = markers[marker].title.toLowerCase();
        if (title.indexOf(q) !== -1)
            list.push(markers[marker].title);
    }
    edit_list_view(list, infowindow);
}

function populate_list() {
    // console.log(markers);
    var list = []
    for (marker in markers) {
        list.push(markers[marker].title);
    }
    // console.log(list);
    edit_list_view(list);
}

function edit_list_view(list, infowindow) {
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
    edit_markers_view(list, infowindow);
}

function edit_markers_view(list, infowindow) {
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
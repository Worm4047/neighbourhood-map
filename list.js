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
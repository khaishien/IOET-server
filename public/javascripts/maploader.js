
var placeSearch, autocomplete, map;
var componentForm = {
    street_number: 'short_name',
    route: 'long_name',
    sublocality_level_1: 'long_name',
    locality: 'long_name',
    administrative_area_level_1: 'short_name',
    country: 'long_name',
    postal_code: 'short_name'
};

function initAutocomplete() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -33.8688, lng: 151.2195 },
        zoom: 13
    });

    // Create the autocomplete object, restricting the search to geographical
    // location types.
    autocomplete = new google.maps.places.Autocomplete(
      /** @type {!HTMLInputElement} */(document.getElementById('autocomplete')),
      { types: ['geocode'] });
    
    autocomplete.bindTo('bounds', map);

    // When the user selects an address from the dropdown, populate the address
    // fields in the form.
    autocomplete.addListener('place_changed', fillInAddress);

}

function fillInAddress() {
    fillInLatLong();

    // Get the place details from the autocomplete object.
    var place = autocomplete.getPlace();
    //console.log('place : ', place);
    console.log('place lat : ', place.geometry.location.lat());
    console.log('place lng : ', place.geometry.location.lng());
    
    document.getElementById('latitude').value = place.geometry.location.lat();
    document.getElementById('longitude').value = place.geometry.location.lng();

    document.getElementById('address1').value = '';
    document.getElementById('address2').value = '';
    document.getElementById('state').value = '';
    document.getElementById('country').value = '';
    document.getElementById('postcode').value = '';

    document.getElementById('address1').disabled = false;
    document.getElementById('address2').disabled = false;
    document.getElementById('state').disabled = false;
    document.getElementById('country').disabled = false;
    document.getElementById('postcode').disabled = false;
    


    // Get each component of the address from the place details
    // and fill the corresponding field on the form.
    for (var i = 0; i < place.address_components.length; i++) {
        var addressType = place.address_components[i].types[0];

        if (componentForm[addressType]) {
            var val = place.address_components[i][componentForm[addressType]];
            if (addressType == "street_number") {
                document.getElementById('address1').value = val + ' ' + document.getElementById('address1').value;
            }else if (addressType == "route") {
                document.getElementById('address1').value = document.getElementById('address1').value + ' ' + val;
            } else if (addressType == "sublocality_level_1") {
                document.getElementById('address2').value = val + ' ' + document.getElementById('address2').value;
            }else if (addressType == "locality") {
                document.getElementById('address2').value = document.getElementById('address2').value + ' ' + val;
            }else if (addressType == "administrative_area_level_1") {
                document.getElementById('state').value = val;
            } else if (addressType == "country") {
                document.getElementById('country').value = val;
            } else if (addressType == "postal_code") {
                document.getElementById('postcode').value = val;
            }
            //document.getElementById(addressType).value = val;
        }
    }
}

function fillInLatLong(){

    var infowindow = new google.maps.InfoWindow();
    var marker = new google.maps.Marker({
        map: map,
        anchorPoint: new google.maps.Point(0, -29)
    });
    
    infowindow.close();
    marker.setVisible(false);
    var place = autocomplete.getPlace();
    if (!place.geometry) {
        window.alert("Autocomplete's returned place contains no geometry");
        return;
    }
    
    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
    } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);  // Why 17? Because it looks good.
    }
    marker.setIcon(/** @type {google.maps.Icon} */({
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(35, 35)
    }));
    marker.setPosition(place.geometry.location);
    marker.setVisible(true);

    //var address = '';
    //if (place.address_components) {
    //    address = [
    //        (place.address_components[0] && place.address_components[0].short_name || ''),
    //        (place.address_components[1] && place.address_components[1].short_name || ''),
    //        (place.address_components[2] && place.address_components[2].short_name || '')
    //    ].join(' ');
    //}
    
    //infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
    //infowindow.open(map, marker);
    
    //click
    map.addListener('click', function (event) {
        
        infowindow.close();
        marker.setVisible(false);
        
        var lat = event.latLng.lat();
        var long = event.latLng.lng();
        
        if (lat) {
            document.getElementById("latitude").value = lat;
        }
        if (long) {
            document.getElementById("longitude").value = long;
        }
        
        marker.setPosition(new google.maps.LatLng(lat, long));
        marker.setVisible(true);


    });


}


// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var geolocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            var circle = new google.maps.Circle({
                center: geolocation,
                radius: position.coords.accuracy
            });
            autocomplete.setBounds(circle.getBounds());
        });
    }
}
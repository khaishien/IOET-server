//console.log(items[0]);

var map, heatmap;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: new google.maps.LatLng(items[0].latitude, items[0].longitude),
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        disableDefaultUI: true
    });
    
    heatmap = new google.maps.visualization.HeatmapLayer({
        data: getPoints(),
        radius: 20,
        map: map
    });
}

function getPoints() {
    var points = [];
    
    //var heatMapData = [
    //    new google.maps.LatLng(39.77745056152344, -86.10900878906250),
    //    new google.maps.LatLng(39.82060623168945, -86.17008972167969),
    //    new google.maps.LatLng(39.77947616577148, -86.17008972167969),
    //    new google.maps.LatLng(39.82987594604492, -86.13955688476562),
    //    new google.maps.LatLng(39.74195098876953, -86.12429046630860)
    //];

    
    for (var i = 0; i < items.length; i++) {
        var point = new google.maps.LatLng(items[i].latitude, items[i].longitude);
        points.push(point);
    }
    //console.log(points);
    return points;
}

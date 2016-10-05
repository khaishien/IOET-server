

window.onload = function () { 
    var svg = document.getElementById("svg");
    
    
    var svgDoc = svg.contentDocument;

    //var room = svgDoc.getElementById("room");
    //var toilet = svgDoc.getElementById("toilet");
    //var living_room = svgDoc.getElementById("living_room");
    if (zonestring != "") {
        var zone = svgDoc.getElementById(zonestring);
        
        zone.style.fill = "lime";
        zone.setAttribute("fill", "lime");
    }
    
};


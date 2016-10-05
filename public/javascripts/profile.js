

$(document).ready(function () {
    var x = document.getElementById("rawJoinSince").innerHTML;
    var date = moment(x).format('DD MMM YYYY');
    document.getElementById("joinSince").innerHTML = date;
});


function confirmActiveUser(){

    if (confirm("Confirm active this user?") == true) {
        window.location.href = '/activecaregiver/'+userid;
    } else {
        
    }
    
}


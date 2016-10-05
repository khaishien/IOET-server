function confirmDeleteUser(userid) {
    //var userid = '56d463450b80d7b80cdaaee2';
    if (confirm("Confirm delete this user?") == true) {
        window.location.href = '/admin/delete/' + userid;
    } else {
        
    }
    
}

function acceptrequest(id){

    if (confirm("Accept this request?") == true) {
        window.location.href = '/caregiver/acceptrequest/' + id;
    }

}

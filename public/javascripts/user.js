
var uvalid = false;
var passvalid = false;
var evalid = false;
var pvalid = false;
var lvalid = false;

function valUsername() {
    var x = document.getElementById("username").value;
    
    if (x.length < 8) {
        $("#username_ok").addClass("hidden");
        $("#username_err").removeClass("hidden");
        uvalid = false;
    } else {
        $("#username_err").addClass("hidden");
        $("#username_ok").removeClass("hidden");
        uvalid = true;
    }
}

function valPassword() {
    var x = document.getElementById("password").value;
    
    if (x.length < 8) {
        $("#password_ok").addClass("hidden");
        $("#password_err").removeClass("hidden");
    } else {
        $("#password_err").addClass("hidden");
        $("#password_ok").removeClass("hidden");
    }
}

function confirmPassword() {
    var x = document.getElementById("password").value;
    var y = document.getElementById("c_password").value;
    if (x != y) {
        $("#cpassword_ok").addClass("hidden");
        $("#cpassword_err").removeClass("hidden");
        passvalid = false;
    } else {
        $("#cpassword_err").addClass("hidden");
        $("#cpassword_ok").removeClass("hidden");
        passvalid = true;
    }
}

function valEmail(){
    var x = document.getElementById("email").value;

    var emailFilter = /^([a-zA-Z0-9_.-])+@(([a-zA-Z0-9-])+.)+([a-zA-Z0-9]{2,4})+$/;

    if (!emailFilter.test(x)) {
        $("#email_ok").addClass("hidden");
        $("#email_err").removeClass("hidden");
        evalid = false;
    } else {
        $("#email_err").addClass("hidden");
        $("#email_ok").removeClass("hidden");
        evalid = true;
    }
}

function valPhone(){
    var x = document.getElementById("phone").value;

    var phoneFilter = /^\+?([0-9]{3})\)?[-. ]?([0-9]{7,9})$/;

    if (!phoneFilter.test(x)) {
        $("#phone_ok").addClass("hidden");
        $("#phone_err").removeClass("hidden");
        pvalid = false;
    } else {
        $("#phone_err").addClass("hidden");
        $("#phone_ok").removeClass("hidden");
        pvalid = true;
    }

}

function valLatLng(){
    var x = document.getElementById("latitude").value;
    var y = document.getElementById("longitude").value;
    if (x != '' && y != '') {
        lvalid = true;
    }
}

function appendAddress(form){
    var x = document.getElementById("address1").value;
    var y = document.getElementById("address2").value;
    $('<input />')
        .attr('type', 'hidden')
        .attr('name', "address")
        .attr('value', x + " " + y)
        .appendTo(form);
    console.log("append address");
}

function selectState(){
    //var selected = document.getElementById('selected_state').value;
    //var element = document.getElementById('state');
    //element.value = selected;
}

//document.getElementById('frm').onsubmit = validate;

function submit() {
    valUsername();
    valPassword();
    valEmail();
    valPhone();
    if (uvalid && passvalid && evalid && pvalid) {
        appendAddress('#registerform');
        document.getElementById("registerform").submit();
    } else {
        window.alert("Please complete the form!");
    }

    
}

function submitUpdate(){
    valEmail();
    valPhone();

    if (evalid && pvalid) {
        document.getElementById("updateform").submit();
    } else {
        window.alert("Please complete the form!");
    }
}

function submitChangePassword(){
    valPassword();
    if (passvalid) {
        document.getElementById("changepasswordform").submit();
    } else {
        window.alert("Password not valid! Please try again.");
    }
}

function submitRegisterElderly(){
    valUsername();
    valPassword();
    valEmail();
    valPhone();
    valLatLng();
    if (uvalid && passvalid && evalid && pvalid && lvalid) {
        appendAddress('#registerelderlyform');
        document.getElementById("registerelderlyform").submit();
    } else {
        window.alert("Please complete the form!");
    }
}

$(document).ready(function () {
    selectState();
});
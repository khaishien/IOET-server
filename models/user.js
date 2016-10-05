var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    username: { type: String, required: true, unique: true },
    password: String,
    userfullname: String,
    useremail: String,
    userprofilepic: String,
    userspeechid: String,
    userspeechphrase: String,
    usercontact: String,
    useraddress: String,
    userpostcode: String,
    userstate: String,
    usercountry: String,
    userhomelat: String,
    userhomelng: String,
    userrole: String,
    login_at: Date,
    created_at: Date,
    updated_at: Date,
    channel_url: String,
    indoormap_id: String,
    alert: { type: Boolean, default: false },
    active: { type: Boolean, default: false }
});

User.pre('save', function (next) {
    var currentDate = new Date();
    this.updated_at = currentDate;
    if (!this.created_at)
        this.created_at = currentDate;
    
    next();
});



User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);
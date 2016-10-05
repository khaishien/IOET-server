var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OutdoorLocation = new Schema({
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    longitude: String,
    latitude: String,
    placeid: String,
    placeaddress: String,
    trained: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OutdoorLocation', OutdoorLocation);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Request = new Schema({
    caregiverid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    elderlyid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relationship: String, 
    requeststatus: { type: Boolean, default: false },
    requestfrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Request', Request);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var IndoorLocation = new Schema({
    zoneid: { type: mongoose.Schema.Types.ObjectId, ref: 'IndoorZone' },
    tagid: { type: mongoose.Schema.Types.ObjectId, ref: 'Tag' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IndoorLocation', IndoorLocation);
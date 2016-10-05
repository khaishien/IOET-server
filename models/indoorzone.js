var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var IndoorZone = new Schema({
    readerid: { type: String, required: true, unique: true },
    elderlyid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    locationname: String
});

module.exports = mongoose.model('IndoorZone', IndoorZone);
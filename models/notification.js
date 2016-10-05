var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Notification = new Schema({
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', Notification);
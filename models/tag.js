var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Tag = new Schema({
    tagid : { type: String, required: true, unique: true },
    elderlyid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timein: Date,
    timeout: Date
});

module.exports = mongoose.model('Tag', Tag);
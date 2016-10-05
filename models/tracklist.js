var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var deepPopulate = require('mongoose-deep-populate')(mongoose);

var TrackList = new Schema({
    caregiverid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    elderlyid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relationship: String,
    outdoor: { type: mongoose.Schema.Types.ObjectId, ref: 'OutdoorLocation' },
    indoor: { type: mongoose.Schema.Types.ObjectId, ref: 'IndoorLocation' }

});

TrackList.plugin(deepPopulate, {
    populate: {
        'indoor.zoneid': {
            select: 'locationname'
        }
    }
});

module.exports = mongoose.model('TrackList', TrackList);
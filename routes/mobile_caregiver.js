var express = require('express');
var passport = require('passport');
var router = express.Router();
var User = require('../models/user');
var TrackList = require('../models/tracklist');
var Tag = require('../models/tag');
var Request = require('../models/request');
var IndoorLocation = require('../models/IndoorLocation');
var OutdoorLocation = require('../models/OutdoorLocation');
var IndoorZone = require('../models/indoorzone');
var Notification = require('../models/notification');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var request = require('request');
var fs = require('fs');
var moment = require('moment');
var access_token = '';
var CronJob = require('cron').CronJob;

var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/bioface/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
var upload = multer({ storage: storage })
//var upload = multer({ dest: 'public/images/bioface/' });


function campareApi(hash, id) {
    
    if (crypto.createHash('md5').update(id).digest('hex') == hash) {
        //console.log("true");
        return true;
    } else {
        //console.log("false");
        return false;
    }
}

var requestPlaceIdFromLatLng = function (ol, callback) {
    
    request.get({
        url: 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + ol.latitude + ',' + ol.longitude + '&key=AIzaSyDgH-OlY9aEGpTnTHYXGhqo3GhfkJoqaBE'
    }, function (err, response, body) {
        if (!err && response.statusCode == 200) {
            
            callback(JSON.parse(body), ol);
        } else {
            callback(null, ol);
        }
    });
};

var requestwns = function (callback) {
    
    if (access_token == '') {
        request.post({
            url: 'https://login.live.com/accesstoken.srf',
            form: {
                grant_type: 'client_credentials',
                client_id: 'ms-app://s-1-15-2-1928481997-1983649005-3650790613-554822377-907085066-4203548631-2947943436',
                client_secret: "/EgHwC/JEE19LV4oYLKyZwmBBrg5Y3U+",
                scope: 'notify.windows.com'
            }
        }, function (err, response, body) {
            if (!err && response.statusCode == 200) {
                
                var json = JSON.parse(body);
                access_token = json.token_type + ' ' + json.access_token;
                //console.log("get access_token   " + access_token);
                callback();
            }
        });
    } else {
        callback();
    }
    
}

function postToWns(uri, xml, type) {
    
    requestwns(function () {
        
        //console.log(access_token.toString());
        console.log("sending wns");
        request.post({
            url: uri,
            headers: {
                'X-WNS-Type': type,
                'Authorization': access_token.toString(),
                'Content-Type': 'text/xml',
                'X-WNS-RequestForStatus': 'true',
                'Content-Length': xml.length
            },
            body: xml

        }, function (err, response, body) {
            if (err) throw err;
            //console.log(response);
            if (response.statusCode == 200) {
                console.log("200 ");
                //return body;
            } else if (response.statusCode == 401) {
                //requestwns();
                console.log("401");
            //return postToWns(uri, xml, type);
            } else if (response.statusCode == 404 || response.statusCode == 410) {
                console.log("404 410");
                //return "";
            } else if (response.statusCode == 406) {
                console.log("406");
                //return "";
            } else {
                console.log("else " + body);
                console.log(response.statusCode);
                //return "";
            }

        });
        
    
    });
}

function monitorelderly() {
    TrackList
    .find()
    .populate('outdoor indoor')
    .exec(function (err, tl) {
        if (err) throw err;
        if (tl) {
            for (var i = 0; i < tl.length; i++) {
                //console.log(tl[i]);
                if (tl[i].indoor != null && tl[i].outdoor != null) {
                    
                    if (moment(tl[i].indoor.timestamp).isBefore(moment(tl[i].outdoor.timestamp))) {
                        
                        //outdoor latest
                        if (moment().diff(tl[i].outdoor.timestamp, 'minutes') > 60) {
                            alertcaregiver(tl[i].caregiverid, tl[i].elderlyid);
                        }
                    } else {
                        //indoor latest
                        if (moment().diff(tl[i].indoor.timestamp, 'minutes') > 60) {
                            alertcaregiver(tl[i].caregiverid, tl[i].elderlyid);
                        }
                    }

                }
            }
        }
    });
};

function alertcaregiver(caregiverid, elderlyid) {
    
    User.findById(caregiverid, function (err, caregiver) {
        if (err) throw err;
        if (caregiver) {
            
            User.findById(elderlyid, function (err, elderly) {
                if (err) throw err;
                if (elderly) {
                    console.log(elderly.userfullname, ' in alert status');
                    
                    var uri = caregiver.channel_url;
                    var type = 'wns/toast';
                    
                    
                    var xml = "<toast launch=\"abababa\">" +
                    "<audio src=\"ms-appx:///Assets/Sounds/sound.wav\" loop=\"true\"/>" +
                    "<visual><binding template=\"ToastText04\">" +
                    "<text id=\"1\">IOET App</text>" +
                    "<text id=\"2\">Elderly " + elderly.userfullname + " had not active more than 1 hour!</text>" +
                    "</binding></visual>" +
                    "</toast>";
                    if (uri != null) {
                        postToWns(uri, xml, type);
                        console.log('sent alert msg to ', caregiver.userfullname);
                    }
                }
            });
        }
    });
};

function UpdateCloudURL(url){
    
    //var encodedURI = encodeURIComponent(url.toString());
    
    //console.log(url);

    request.get({
        url: 'http://usm-cs-ihome-developer-edition.ap2.force.com/Update_Channel_URL?id=a042800000FAxsP&url=' + url
    }, function (err, response, body) {
        if (!err && response.statusCode == 200) {
            
            console.log("success updated cloud url.");
        } else {
            console.log("failed update cloud url.");

        }
    });
};

//var job = new CronJob('5 * * * * *', function () {
//    monitorelderly();
//    console.log("checking elderly status...");
//}, null, true, 'America/Los_Angeles');
//job.start();


/* POST login */
router.post('/login', passport.authenticate('local'), function (req, res, next) {
    
    User.findOne({
        username: req.body.username
    }, function (err, user) {
        if (err) throw err;
        
        if (user) {
            
            //var hash = bcrypt.hashSync(user._id);
            var hash = crypto.createHash('md5').update(String(user._id)).digest('hex');
            
            var currentDate = new Date();
            user.login_at = currentDate;
            
            //update user login date
            user.save(function (err) {
                if (err) throw err;
                
                res.send({
                    _id: user._id,
                    userfullname: user.userfullname,
                    userrole: user.userrole,
                    api: hash
                });
            });
             

        } else {
            res.status(500);
            res.send();
        }
    });
});

/* GET update last login time */
router.get('/updatelogin/:api/:id', function (req, res, next) {
    
    if (campareApi(req.params.api, req.params.id)) {
        
        User.findById(req.params.id, function (err, user) {
            
            var currentDate = new Date();
            user.login_at = currentDate;
            
            user.save(function (err) {
                if (err) throw err;
                res.send();

            })

        })
    }

});

/* GET update voice id */
router.get('/updatevoice/:api/:id/:voiceid/:phrase', function (req, res, next) {
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        
        User
        .findById(id, function (err, user) {
            if (err) throw err;
            if (user) {
                
                user.userspeechid = req.params.voiceid;
                user.userspeechphrase = req.params.phrase;
                
                console.log(req.params.voiceid, req.params.phrase);
                user.save(function (err) {
                    if (err) throw err;
                    res.send();
                })

            }
        });
    }
});

/* GET voice id user */
router.get('/getvoice/:api/:id', function (req, res, next) {
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        User.findById(id, function (err, user) {
            if (err) throw err;
            if (user) {
                if (user.userspeechid == null) {
                    res.status(404);
                    res.send();
                } else {
                    //console.log('speech-', user.userspeechid);
                    res.send({
                        speechid : user.userspeechid,
                        phrase : user.userspeechphrase
                    });
                }
                
            } else {
                res.status(404);
                res.send();
            }
        })
    }
});

/* GET delete id user test */
router.get('/deletevoice', function (req, res, next) {
    User.findById('56e41bedc796320c26eba72e', function (err, user) {
        if (user) {
            user.userspeechid = null;
            user.save(function (err) {
                res.send();
            })
        }
    })
})

/* GET all elderly list */
router.get('/elderly/:api/:id', function (req, res, next) {
    
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        
        TrackList
        .find({ caregiverid : id })
        .select('elderlyid relationship outdoor indoor')
        .populate('elderlyid outdoor')
        .deepPopulate('indoor.zoneid')
        .exec(function (err, tracklist) {
            if (err) throw err;
            //console.log(tracklist);
            res.send(tracklist);
            
        });


    } else {
        res.status(400);
    }

});

/* GET profile */
router.get('/profile/:api/:id', function (req, res, next) {
    //console.log("in");
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        
        User.findById(id, function (err, user) {
            if (err) throw err;
            if (user) {
                //console.log(user);
                res.send(user);
            }
        })
    }
});

/* GET get one track list */
router.get('/tracklist/:api/:id/:track_id', function (req, res, next) {
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        TrackList
        .findOne({ _id : req.params.track_id })
        .select('elderlyid relationship outdoor indoor')
        .populate('elderlyid outdoor')
        .deepPopulate('indoor.zoneid')
        .exec(function (err, tracklist) {
            if (err) throw err;
            if (tracklist) {
                //console.log(tracklist);
                res.send(tracklist);
                
            }
        });
    }
});

/* GET get indoor zone data */
router.get('/indoorzone/:api/:id/:zoneid', function (req, res, next) {
    if (campareApi(req.params.api, req.params.id)) {
        IndoorZone
        .findById(req.params.zoneid, function (err, zone) {
            if (err) throw err;
            if (zone) {
                //console.log(zone);
                res.send(zone);
            }
        });
    }
});

/* GET get chat list track list */
router.get('/chatlist/:role/:api/:id', function (req, res, next) {
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        
        if (req.params.role == 'elderly') {
            
            TrackList
            .find({ elderlyid : id })
            .select('caregiverid')
            .populate('caregiverid')
            .exec(function (err, tracklist) {
                if (err) throw err;
                if (tracklist) {
                    //console.log(tracklist);
                    res.send(tracklist);
                
                }
            });


        } else if (req.params.role == 'caregiver') {
            
            TrackList
            .find({ caregiverid : id })
            .select('elderlyid ')
            .populate('elderlyid')
            .exec(function (err, tracklist) {
                if (err) throw err;
                if (tracklist) {
                    //console.log(tracklist);
                    res.send(tracklist);
                
                }
            });

        }
        
    }
});

/* GET get chat content */
router.get('/chatcontent/:api/:id/:other_id', function (req, res, next) {
    
    var id1 = req.params.id;
    var id2 = req.params.other_id;
    
    if (campareApi(req.params.api, id1)) {
        
        Notification
        .find({
            $or: [
                {
                    to: id1 ,
                    from: id2
                },
                {
                    to: id2,
                    from: id1
                }
            ]
        })
        .sort({
            timestamp : 1
        })
        .populate('to from')
        .exec(function (err, chat) {
            
            if (err) throw err;
            res.send(chat);
        });

    }


});

/* POST send chat content by user */
router.post('/sendchat/:api/:id', function (req, res, next) {
    if (campareApi(req.params.api, req.params.id)) {
        
        var content = new Notification({
            to : req.body.to,
            from : req.body.from,
            content : req.body.content,
            timestamp : req.body.timestamp
        });
        
        content.save(function (err, c) {
            if (err) throw err;
            
            Notification
            .findOne({ _id : c._id })
            .populate("to from")
            .exec(function (err, n) {
                if (err) throw err;
                
                var uri = n.to.channel_url;
                var type = 'wns/toast';
                
                
                var xml = "<toast launch=\"abababa\">" +
                                    "<audio src=\"ms-appx:///Assets/Sounds/sound.wav\" loop=\"true\"/>" +
                                    "<visual><binding template=\"ToastText04\">" +
                                    "<text id=\"1\">IOET App</text>" +
                                    "<text id=\"2\">" + n.from.userfullname + " say " + req.body.content + ".</text>" +
                                    "</binding></visual>" +
                                    "</toast>";
                
                if (uri != null) {
                    postToWns(uri, xml, type);
                    console.log('sent msg to ', n.to.userfullname);
                }
                
                
                res.send();

            })

            
        });

    }
});

/* GET get caregiver list for send request */
router.get('/elderly/caregiverlist/:api/:id', function (req, res, next) {
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        
        var valid_users = [];
        
        User.find({
            $or: [
                { userrole: 'admin' },
                { userrole: 'caregiver' }
            ]
        }, function (err, users) {
            if (err) throw err;
            if (users) {
                
                Request
                .find({
                    elderlyid : id,
                    requeststatus : false
                })
                .select('caregiverid')
                .populate('caregiverid')
                .exec(function (err, requests) {
                    if (err) throw err;
                    
                    if (requests) {
                        
                        TrackList.find({ elderlyid : id })
                        .select('caregiverid')
                        .populate('caregiverid')
                        .exec(function (err, tracklists) {
                            if (err) throw err;
                            if (tracklists) {
                                
                                //console.log(user);
                                res.send({
                                    users : users,
                                    requests : requests,
                                    tracklists : tracklists
                                });

                            }
                        });
                    }
                });
            }
        });
    }
});

/* GET get monitor list of tracklist */
router.get('/elderly/monitorlist/:api/:id', function (req, res, next) {
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        
        TrackList
        .find({ elderlyid : id })
        .select('caregiverid relationship')
        .populate('caregiverid')
        .exec(function (err, tracklist) {
            if (err) throw err;
            if (tracklist) {
                res.send(tracklist);
            }
        })
    }
});

/* GET get one track list elderly */
router.get('/elderly/requestlist/:api/:id', function (req, res, next) {
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        
        //not request from elderly
        Request
        .find({
            elderlyid: id,
            requestfrom: { '$ne': id },
            requeststatus: false
        })
        .select('caregiverid relationship requeststatus')
        .populate('caregiverid')
        .exec(function (err, request) {
            if (err) throw err;
            if (request) {
                res.send(request);
            }
        });
    }
});

/* GET cancel monitor by elderly */
router.get('/elderly/cancelmonitor/:api/:id/:tracklist_id', function (req, res, next) {
    if (campareApi(req.params.api, req.params.id)) {
        
        TrackList
        .findOne({ _id: req.params.tracklist_id })
        .populate("caregiverid elderlyid")
        .exec(function (err, tl) {
            if (err) throw err;
            if (tl) {
                
                
                var uri = tl.caregiverid.channel_url;
                var type = 'wns/toast';
                
                
                var xml = "<toast launch=\"abababa\">" +
                        "<audio src=\"ms-appx:///Assets/Sounds/sound.wav\" loop=\"true\"/>" +
                        "<visual><binding template=\"ToastText04\">" +
                        "<text id=\"1\">IOET App</text>" +
                        "<text id=\"2\">Elderly " + tl.elderlyid.userfullname + " has canceled your monitor.</text>" +
                        "</binding></visual>" +
                        "</toast>";
                
                if (uri != null) {
                    postToWns(uri, xml, type);
                    console.log('sent msg to ', tl.caregiverid.userfullname);
                }
                
                TrackList.findByIdAndRemove(req.params.tracklist_id, function (err) {
                    if (err) throw err;
                    res.send();
                });

            }
        })

        

    }
});

router.get('/elderly/caregiverno/:api/:id/', function (req, res, next) {
    if (campareApi(req.params.api, req.params.id)) {
        
        TrackList.find({
            elderlyid: req.params.id
        }, function (err, tl) {
            if (err) throw err;
            if (tl) {
                var num = [];
                console.log(tl);
                
                tl.forEach(function (item) {
                    var caregiverid = item.caregiverid;
                    User.findById(caregiverid, function (err, user) {
                        if (err) throw err;
                        if (user) {
                            if (user.usercontact) {
                                num.push(user);
                                

                            }
                            
                            if (tl[tl.length - 1].caregiverid == item.caregiverid) {
                                res.send(num);
                            }
                        }
                    });
                });
                
                
                
            }
        });

    }
})

/* GET update tracklist status to caregiver */
router.get('/elderly/sendrequest/:api/:id/:caregiverid', function (req, res, next) {
    if (campareApi(req.params.api, req.params.id)) {
        
        var request = new Request({
            caregiverid : req.params.caregiverid,
            elderlyid : req.params.id,
            relationship : 'parent',
            requestfrom : req.params.id
        });
        
        request.save(function (err, r) {
            if (err) throw err;
            
            Request
            .findOne({ _id: request._id })
            .populate("caregiverid elderlyid")
            .exec(function (err, r) {
                if (err) throw err;
                if (r) {
                    
                    var uri = r.caregiverid.channel_url;
                    var type = 'wns/toast';
                    
                    
                    var xml = "<toast launch=\"abababa\">" +
                                    "<audio src=\"ms-appx:///Assets/Sounds/sound.wav\" loop=\"true\"/>" +
                                    "<visual><binding template=\"ToastText04\">" +
                                    "<text id=\"1\">IOET App</text>" +
                                    "<text id=\"2\">Elderly " + r.elderlyid.userfullname + " has sent monitoring request.</text>" +
                                    "</binding></visual>" +
                                    "</toast>";
                    
                    if (uri != null) {
                        postToWns(uri, xml, type);
                        console.log('sent msg to ', r.caregiverid.userfullname);
                    }

                }
            })
            
            res.send();
        });
        

    }
});

/* GET update request status by elderly */
router.get('/elderly/updaterequest/:api/:id/:request_id/:status', function (req, res, next) {
    
    if (campareApi(req.params.api, req.params.id)) {
        
        Request
        .findById({ _id : req.params.request_id })
        .populate('elderlyid caregiverid')
        .exec(function (err, request) {
            
            if (err) throw err;
            if (request) {
                if (req.params.status == "True") {
                    
                    request.requeststatus = true;
                    request.save(function (err) {
                        if (err) throw err;
                        console.log('accepted request');
                        
                        var tracklist = new TrackList({
                            caregiverid : request.caregiverid._id,
                            elderlyid : request.elderlyid._id,
                            relationship : request.relationship
                        });
                        
                        tracklist.save(function (err) {
                            if (err) throw err;
                            
                            var uri = request.caregiverid.channel_url;
                            var type = 'wns/toast';
                            
                            
                            var xml = "<toast launch=\"abababa\">" +
                                    "<audio src=\"ms-appx:///Assets/Sounds/sound.wav\" loop=\"true\"/>" +
                                    "<visual><binding template=\"ToastText04\">" +
                                    "<text id=\"1\">IOET App</text>" +
                                    "<text id=\"2\">Elderly " + request.elderlyid.userfullname + " has accepted request.</text>" +
                                    "</binding></visual>" +
                                    "</toast>";
                            
                            if (uri != null) {
                                postToWns(uri, xml, type);
                                console.log('sent msg to ', request.caregiverid.userfullname);
                            }
                            
                            res.send();
                        });

                    });
                }
            } else {
                res.status(500);
                res.send();
            }
        });
        

        
    }
});

/*  GET all indoor list */
router.get('/indoorlist/:api/:id/:elderlyid', function (req, res, next) {
    if (campareApi(req.params.api, req.params.id)) {
        
        Tag
        .findOne({
            elderlyid : req.params.elderlyid
        }, function (err, tag) {
            if (err) throw err;
            if (tag) {
                //console.log(tag);
                
                IndoorLocation
                .find({ tagid : tag._id })
                .populate('zoneid')
                .exec(function (err, il) {
                    if (err) throw err;
                    if (il) {
                        res.send(il);
                        //console.log(il);
                    }
                });
            }
        });
    }
});

/* GET heat map view for elderly featured location */
router.get('/heatmap/:api/:id/:elderlyid', function (req, res, next) {
    //if (campareApi(req.params.api, req.params.id)) {
    
    OutdoorLocation
        .find({
        userid: req.params.elderlyid
    }, function (err, ol) {
        if (ol) {
            res.render('elderlyheatmap', {
                title: 'heatmap',
                list: ol
            });




        }
        
    });

    //}
});

/* GET all outdoor list */
router.get('/outdoorlist/:api/:id/:elderlyid', function (req, res, next) {
    if (campareApi(req.params.api, req.params.id)) {
        
        OutdoorLocation
        .find({
            userid: req.params.elderlyid
        }, function (err, ol) {
            if (ol) {
                res.send(ol);
                //console.log(ol);
            }
        
        });
    }
});

/* POST add one outdoor position */
router.post('/elderly/outdoor/:api/:id', function (req, res, next) {
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        
        //console.log(req.body);
        var outdoorPosition = new OutdoorLocation({
            userid: id,
            longitude: req.body.lng,
            latitude: req.body.lat
        });
        
        //console.log(outdoorPosition);
        
        outdoorPosition.save(function (err, position) {
            if (err) {
                throw err;
                console.log("update outdoor location err: ", err);
                
                res.status(500);
                res.send();
            } else {
                
                //console.log(position);
                TrackList.find({
                    elderlyid : id
                }, function (err, tlist) {
                    if (tlist) {
                        //tlist.outdoor = position._id;
                        
                        //tlist.save(function (err) {
                        //    console.log("save");
                        //});
                        
                        for (var i = 0; i < tlist.length; i++) {
                            tlist[i].outdoor = position._id;
                            tlist[i].save(function (err) {
                                console.log("save latest outdoor position.");
                            });
                        }

                        //console.log(tlist);
                    }

                });
                
                
                res.status(200);
                res.send();
            }
        });
        

    }
});

/* GET update nfc location notify */
router.get('/elderly/updatenfc/:api/:id', function (req, res, next) {
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        
        TrackList
        .find({ elderlyid : id })
        .select('caregiverid elderlyid')
        .populate('caregiverid elderlyid')
        .exec(function (err, tracklist) {
            if (err) throw err;
            
            if (tracklist) {
                for (var tl in tracklist) {
                    var uri = tracklist[tl].caregiverid.channel_url;
                    var type = 'wns/toast';
                    
                    var xml = "<toast launch=\"abababa\">" +
                    "<audio src=\"ms-appx:///Assets/Sounds/sound.wav\" loop=\"true\"/>" +
                    "<visual><binding template=\"ToastText04\">" +
                    "<text id=\"1\">IOET App</text>" +
                    "<text id=\"2\">NFC tag updated location from " + tracklist[0].elderlyid.userfullname + "</text>" +
                    "</binding></visual>" +
                    "</toast>";
                    
                    postToWns(uri, xml, type);
                }
                res.send();
            } else {
                res.status(500);
                res.send();
            }

                
        });

    }
});

/* GET get elderly id from tracklistid*/
router.get("/getelderlyid/:api/:id/:tracklistid", function (req, res, next) {
    if (campareApi(req.params.api, req.params.id)) {
        TrackList
        .findById(req.params.tracklistid, function (err, tl) {
            if (err) throw err;
            if (tl) {
                console.log(tl.elderlyid);
                res.send(tl.elderlyid);
            }
        });
    }
});

/* POST add featured location for elderly */
router.get('/featuredlocation/:api/:id/:elderlyid', function (req, res, next) {
    if (campareApi(req.params.api, req.params.id)) {
        
        //var newplace = new FeaturedLocation({
        //    placeid : req.body.place_id,
        //    placedescription : req.body.description,
        //    elderlyid : req.params.elderlyid,
        //    createdby : req.params.id
        //});
        
        //newplace.save(function (err){
        //    if (err) throw err;
        //    res.send();
        //})
        var fl = [];
        OutdoorLocation
        .find({
            userid: req.params.elderlyid,
            trained: true,
        }, function (err, ol) {
            if (err) throw err;
            if (ol) {
                //for (var i = 0; i < ol.length; i++) {
                
                //    if (fl.length < 1) {
                //        var temp = {
                //            placeid : ol[i].placeid,
                //            count : 1
                //        };
                //        fl.push(temp);
                //        console.log(fl);
                
                //    } else {
                //        var added = false;
                
                //        for (var j = 0; j < fl.length; j++) {
                
                //            if (fl[j].placeid == ol[i].placeid) {
                
                //                fl[j].count++;
                //                added = true;
                //                break;
                //            }
                //        }
                
                //        if (added == false) {
                //            var temp = {
                //                placeid : ol[i].placeid,
                //                count : 1
                //            };
                //            fl.push(temp);
                //        }
                //    }
                //}
                
                //console.log(fl);
                //res.send(fl);
                res.send(ol);



            }
        });


    }
});

router.get('/featuredlocation/train/:api/:id/:elderlyid', function (req, res, next) {
    if (campareApi(req.params.api, req.params.id)) {
        
        //$near
        //ChIJz6YqJ7HBSjARc2gMWUJbWWU
        
        
        OutdoorLocation
        .find({
            userid: req.params.elderlyid
        }, function (err, ol) {
            if (err) throw err;
            if (ol) {
                //console.log(ol);
                //update place id
                for (var i = 0; i < ol.length; i++) {
                    
                    if (ol[i].placeid == null) {
                        requestPlaceIdFromLatLng(ol[i], function (result, l) {
                            if (result) {
                                if (result.status == 'OK') {
                                    OutdoorLocation.findById(l._id, function (err, outdoor) {
                                        if (err) throw err;
                                        if (outdoor) {
                                            
                                            //console.log(result);
                                            outdoor.placeid = result.results[0].place_id;
                                            outdoor.placeaddress = result.results[0].formatted_address;
                                            outdoor.trained = true;
                                            
                                            outdoor.save(function (err) {
                                                if (err) throw err;
                                                else
                                                    console.log("place id updated!");
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
                res.send();



            }
        });
    }
});


/* GET notify alert to caregiver */
router.get('/elderly/alert/:api/:id/:type', function (req, res, next) {
    
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        
        User.findById(id, function (err, elderly) {
            if (err) throw err;
            if (elderly) {
                
                elderly.alert = true;
                
                elderly.save(function (err) {
                    if (err) throw err;
                    
                });
            } else {
                res.status(500);
                res.send();
                return;
            }
        });
        
        //send notification
        TrackList
        .find({ elderlyid : id })
        .select('caregiverid elderlyid')
        .populate('caregiverid elderlyid')
        .exec(function (err, tracklist) {
            if (err) throw err;
            if (tracklist) {
                if (req.params.type == "1") {
                    for (var tl in tracklist) {
                        
                        var uri = tracklist[tl].caregiverid.channel_url;
                        var type = 'wns/toast';
                        //var xml = "<toast launch=''>< visual lang='en-US'><binding template='ToastImageAndText01'><image id='1' src='World'/><text id='1'>Hello</text></binding></visual></toast>";
                        
                        //var xml = "<?xml version=\"1.0\" encoding=\"utf-16\"?><toast><visual><binding template='ToastImageAndText01'><image='1' src='https://cdn0.iconfinder.com/data/icons/very-basic-android-l-lollipop-icon-pack/24/attention-128.png'/><text id='1'>Alert help " 
                        //+ tracklist[0].elderlyid.userfullname + "</text></binding></visual></toast>";
                        
                        var xml = "<toast>" +
                        "<audio src=\"ms-appx:///Assets/Sounds/sound.wav\" loop=\"true\"/>" +
                        "<visual><binding template=\"ToastText04\">" +
                        "<text id=\"1\">IOET App</text>" +
                        "<text id=\"2\">Alert help from " + tracklist[0].elderlyid.userfullname + "</text>" +
                        "</binding></visual>" +
                        "</toast>";
                        if (uri) {
                            postToWns(uri, xml, type);
                        }
                
                
                    }
                } else if (req.params.type == "2") {
                    for (var tl in tracklist) {
                        var uri = tracklist[tl].caregiverid.channel_url;
                        var type = 'wns/toast';
                        
                        var xml = "<toast>" +
                        "<audio src=\"ms-appx:///Assets/Sounds/sound.wav\" loop=\"true\"/>" +
                        "<visual><binding template=\"ToastText04\">" +
                        "<text id=\"1\">IOET App</text>" +
                        "<text id=\"2\">Elderly " + tracklist[0].elderlyid.userfullname + " mobile location service is turn off or not functioning.</text>" +
                        "</binding></visual>" +
                        "</toast>";
                        if (uri) {
                            postToWns(uri, xml, type);
                        }

                    }
                }
                
                res.send();
            } else {
                res.status(500);
                res.send();
            }
        });

    }
});

/* GET disable alert to elderly */
router.get('/caregiver/disablealert/:api/:id/:elderlyid', function (req, res, next) {
    var elderlyid = req.params.elderlyid;
    if (campareApi(req.params.api, req.params.id)) {
        
        User.findById(elderlyid, function (err, elderly) {
            if (err) throw err;
            if (elderly) {
                elderly.alert = false;
                
                elderly.save(function (err) {
                    if (err) throw err;
                    res.send();
                });
            } else {
                res.status(500);
                res.send();
            }
        })
    }
});

/* POST update channel uri that use for notification */
router.post('/updatechanneluri/:api/:id', function (req, res, next) {
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        
        User.findById(id, function (err, user) {
            if (err) throw err;
            
            if (user) {
                user.channel_url = req.body.uri;
                
                if(user.userfullname == 'Gary')
                    UpdateCloudURL(req.body.uri);

                user.save(function (err) {
                    if (err) throw err;
                    
                    res.send();
                });
            } else {
                
                res.status(500);
                res.send();
            }
        });

    }
});

/* GET elderly home location */
router.get('/homelocation/:api/:id', function (req, res, next) {
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        User.findById(id, function (err, user) {
            if (err) throw err;
            if (user) {
                
                var home = {
                    latitude : user.userhomelat,
                    longitude: user.userhomelng
                };
                
                res.send(home);
            }
        });
    }
});

/* GET update elderly in home status true=in home */
router.get('/promptcaregiver/:api/:id/:status', function (req, res, next) {
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        var inHome = req.params.status;
        
        console.log(inHome);
        
        TrackList
        .find({ elderlyid : id })
        .select('caregiverid elderlyid')
        .populate('caregiverid elderlyid')
        .exec(function (err, tracklist) {
            if (err) throw err;
            if (tracklist) {
                if (inHome == "True") {
                    for (var tl in tracklist) {
                        
                        var uri = tracklist[tl].caregiverid.channel_url;
                        var type = 'wns/toast';
                        
                        var xml = "<toast>" +
                        "<audio src=\"ms-appx:///Assets/Sounds/sound.wav\" loop=\"true\"/>" +
                        "<visual><binding template=\"ToastText04\">" +
                        "<text id=\"1\">IOET App</text>" +
                        "<text id=\"2\">" + tracklist[0].elderlyid.userfullname + " returned to home.</text>" +
                        "</binding></visual>" +
                        "</toast>";
                        if (uri) {
                            postToWns(uri, xml, type);
                        }
                
                
                    }
                } else {
                    for (var tl in tracklist) {
                        var uri = tracklist[tl].caregiverid.channel_url;
                        var type = 'wns/toast';
                        
                        var xml = "<toast>" +
                        "<audio src=\"ms-appx:///Assets/Sounds/sound.wav\" loop=\"true\"/>" +
                        "<visual><binding template=\"ToastText04\">" +
                        "<text id=\"1\">IOET App</text>" +
                        "<text id=\"2\">" + tracklist[0].elderlyid.userfullname + " left from home.</text>" +
                        "</binding></visual>" +
                        "</toast>";
                        if (uri) {
                            postToWns(uri, xml, type);
                        }

                    }
                }
                
                res.send();
            } else {
                res.status(500);
                res.send();
            }
        });

    }
});

/*GET prompt caregiver elderly nfc tap */
router.get('/promptcaregivernfc/:api/:id/:lat/:lng', function (req, res, next) {
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        TrackList
        .find({ elderlyid : id })
        .populate("caregiverid elderlyid")
        .exec(function (err, tracklist) {
            
            var ol = {
                latitude: req.params.lat,
                longitude: req.params.lng
            };

            requestPlaceIdFromLatLng(ol, function (result, l) {
                if (result) {
                    if (result.status == 'OK') {
                        for (var tl in tracklist) {
                            console.log(tracklist);
                            console.log("here" + tracklist[tl].caregiverid.userfullname);
                            var uri = tracklist[tl].caregiverid.channel_url;
                            var type = 'wns/toast';
                            
                            var xml = "<toast>" +
                            "<audio src=\"ms-appx:///Assets/Sounds/sound.wav\" loop=\"true\"/>" +
                            "<visual><binding template=\"ToastText04\">" +
                            "<text id=\"1\">IOET App</text>" +
                            "<text id=\"2\">" + tracklist[0].elderlyid.userfullname + " tap NFC at " + result.results[0].formatted_address + ".</text>" +
                            "</binding></visual>" +
                            "</toast>";
                            if (uri) {
                                console.log("here" );

                                postToWns(uri, xml, type);
                            }
                        }
                    }
                }
            });
                

            
        });
    }
})

/* GET prompt caregiver elderly naviagate home */
router.get('/promptcaregiverlocation/:api/:id', function (req, res, next) {
    
    var id = req.params.id;
    if (campareApi(req.params.api, id)) {
        
        TrackList
        .find({ elderlyid : id })
        .populate("caregiverid elderlyid")
        .exec(function (err, tracklist) {
            if (tracklist) {
                
                for (var tl in tracklist) {
                    
                    var uri = tracklist[tl].caregiverid.channel_url;
                    var type = 'wns/toast';
                    
                    var xml = "<toast>" +
                        "<audio src=\"ms-appx:///Assets/Sounds/sound.wav\" loop=\"true\"/>" +
                        "<visual><binding template=\"ToastText04\">" +
                        "<text id=\"1\">IOET App</text>" +
                        "<text id=\"2\">" + tracklist[0].elderlyid.userfullname + " navigate to home.</text>" +
                        "</binding></visual>" +
                        "</toast>";
                    if (uri) {
                        postToWns(uri, xml, type);
                    }
                
                
                }
            }
        });

    }
})

/* GET test server */
router.get('/test', function (req, res, next) {
    res.send();
})

module.exports = router;

function asyncLoop(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: function () {
            if (done) {
                return;
            }
            
            if (index < iterations) {
                index++;
                func(loop);

            } else {
                done = true;
                callback();
            }
        },
        
        iteration: function () {
            return index - 1;
        },
        
        break: function () {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
}
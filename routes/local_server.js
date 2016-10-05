var express = require('express');
var passport = require('passport');
var router = express.Router();
var User = require('../models/user');
var IndoorZone = require('../models/indoorzone');
var IndoorLocation = require('../models/IndoorLocation');
var Tag = require('../models/tag');
var TrackList = require('../models/tracklist');
var crypto = require('crypto');

var multer = require('multer');
//var upload = multer({ dest: 'public/map/' });

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/map/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + ".svg")
    }
});
var upload = multer({ storage: storage })


function compareApi(hash, id) {
    
    if (crypto.createHash('md5').update(id).digest('hex') == hash) {
        //console.log("true");
        return true;
    } else {
        //console.log("false");
        return false;
    }
}

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

/* GET indoor map */
router.get('/indoormap/:api/:id/:tagid/:readerid', function (req, res, next) {
    
    if (compareApi(req.params.api, req.params.id)) {
        var tagid = req.params.tagid;
        var readerid = req.params.readerid;
        
        Tag.findOne({
            tagid : tagid
        }, function (err, tag) {
            if (err) throw err;
            if (tag) {
                var elderlyid = tag.elderlyid;
                
                User.findById(elderlyid, function (err, user) {
                    if (err) throw err;
                    if (user) {
                        console.log('a:', user);
                        
                        if (user.indoormap_id) {
                            if (readerid != "0") {
                                
                                IndoorZone.findOne({
                                    readerid: readerid,
                                    elderlyid: elderlyid
                                }, function (err, indoorzone) {
                                    if (err) throw err;
                                    if (indoorzone) {
                                        
                                        console.log(user.indoormap_id);
                                        
                                        res.render('indoormap', {
                                            title: 'indoormap',
                                            map: user.indoormap_id,
                                            zone: indoorzone.locationname
                                        });


                                    }
                                });
                            } else {
                                res.render('indoormap', {
                                    title: 'indoormap',
                                    map: user.indoormap_id
                                });
                            }
                        }
                        
                    }
                });
            }
        });
    }
});

/* POST update indoor map */
router.post('/indoormap/:api/:id/:elderlyid', upload.single('map'), function (req, res, next) {
    
    if (compareApi(req.params.api, req.params.id)) {
        var elderlyid = req.params.elderlyid;
        
        var file = req.file;
        console.log(file.filename);
        
        User.findById(elderlyid, function (err, user) {
            if (err) throw err;
            if (user) {
                user.indoormap_id = file.filename;
                
                user.save(function (err) {
                    if (err) throw err;
                    
                    //console.log(user);
                    res.send();
                });
            }
        });




    }
});

/* GET get zone by elderly */
router.get('/zone/:api/:id/:elderlyid', function (req, res, next) {
    
    if (compareApi(req.params.api, req.params.id)) {
        
        IndoorZone.find({
            elderlyid : req.params.elderlyid
        }, function (err, list) {
            if (err) throw err;
            if (list) {
                res.send(list);
            }
        })
    }
});

/* GET get all elderly under monitor by caretgiver with tag id */
router.get('/tracklist/:api/:id', function (req, res, next) {
    
    
    if (compareApi(req.params.api, req.params.id)) {
        
        TrackList
        .find({ caregiverid : req.params.id })
        .select('elderlyid relationship')
        .populate('elderlyid')
        .exec(function (err, tracklist) {
            if (err) throw err;
            var list = [];
            res.send(tracklist);
        });
    }
});

/*  GET get tag id from elderlyid */
router.get('/tagid/:api/:id/:elderlyid', function (req, res, next) {
    if (compareApi(req.params.api, req.params.id)) {
        
        Tag
        .findOne({ elderlyid : req.params.elderlyid })
        .exec(function (err, tag) {
            if (err) throw err;
            if (tag) {
                res.send(tag.tagid);
            } else {
                res.send();
            }
        });

    }
});


/* GET get all elderly tag by id */
router.post('/tag/:api/:id', function (req, res, next) {
    if (compareApi(req.params.api, req.params.id)) {
        
        var tagid = req.body.tagid;
        var elderlyid = req.body.elderlyid;
        
        if (tagid && elderlyid) {
            
            Tag.findOne({
                elderlyid : elderlyid
            }, function (err, tag) {
                if (err) throw err;
                if (tag) {
                    tag.tagid = tagid;
                    
                    tag.save(function (err) {
                        if (err) throw err;
                        else {
                            res.send();
                        }


                    })
                } else {
                    
                    var newtag = new Tag({
                        elderlyid: elderlyid,
                        tagid: tagid
                    });
                    
                    newtag.save(function (err) {
                        if (err) throw err;
                        else {
                            res.send();
                        }
                    });
                }
            });
        }

        

        
    }
});

/* GET get all reader list by elderlyid */
router.get('/reader/:api/:id/:elderlyid', function (req, res, next) {
    if (compareApi(req.params.api, req.params.id)) {
        IndoorZone
        .find({ elderlyid : req.params.elderlyid })
        .populate('elderlyid')
        .exec(function (err, indoorzone) {
            if (err) throw err;
            if (indoorzone) {
                res.send(indoorzone);
            }
        });
    }
});

/* GET delete zone */
router.get('/deletezone/:api/:id/:zoneid', function (req, res, next) {
    if (compareApi(req.params.api, req.params.id)) {
        IndoorZone
        .findByIdAndRemove(req.params.zoneid, function (err) {
            if (err) throw err;
            else {
                res.send();
            }
            
        });
    }
})

/* POST add new zone */
router.post('/newzone/:api/:id', function (req, res, next) {
    if (compareApi(req.params.api, req.params.id)) {
        
        var readerid = req.body.readerid;
        var locationname = req.body.locationname;
        var elderlyid = req.body.elderlyid;
        var zoneid = req.body._id;
        
        if (zoneid) {
            
            if (readerid && locationname && elderlyid) {
                
                IndoorZone
                .findById(zoneid, function (err, indoorzone) {
                    if (err) throw err;
                    if (indoorzone) {
                        
                        indoorzone.readerid = readerid;
                        indoorzone.locationname = locationname;
                        indoorzone.elderlyid = elderlyid;
                        
                        indoorzone.save(function (err) {
                            if (err) throw err;
                            res.send();
                        })

                    } else {
                        console.log("here");
                    }
                });

            }

        } else {
            if (readerid && locationname && elderlyid) {
                
                var newZone = IndoorZone({
                    readerid : readerid,
                    locationname : locationname,
                    elderlyid : elderlyid
                });
                
                newZone.save(function (err) {
                    if (err) throw err;
                    res.send();
                });

            }
        }


    }
});

router.get("/indoorposition/:api/:id/:tagid/:readerid", function (req, res, err) {
    if (compareApi(req.params.api, req.params.id)) {
        var tagid = req.params.tagid;
        var readerid = req.params.readerid;
        
        
        
        Tag.findOne({
            tagid : tagid
        }, function (err, tag) {
            if (err) throw err;
            if (tag) {
                var elderlyid = tag.elderlyid;
                console.log('found tag:', tag._id);
                
                IndoorZone.findOne({
                    readerid: readerid,
                    elderlyid: elderlyid
                }, function (err, indoorzone) {
                    if (err) throw err;
                    if (indoorzone) {
                        
                        console.log('found indoorzone:', indoorzone._id);
                        
                        
                        var newindoorlocation = new IndoorLocation({
                            zoneid : indoorzone._id,
                            tagid : tag._id
                        });
                        
                        newindoorlocation.save(function (err, position) {
                            if (err) throw err;
                            else {
                                
                                TrackList
                                .find({
                                    elderlyid : elderlyid
                                }, function (err, tl) {
                                    if (tl) {
                                        for (var i = 0; i < tl.length; i++) {
                                            tl[i].indoor = position._id;
                                            tl[i].save(function (err) {
                                                console.log("updated latest indoor position.");
                                            });
                                        }
                                    }
                                });
                                
                                res.send();
                            }
                        });
                    }
                });

            }
        });

    }
});

module.exports = router;
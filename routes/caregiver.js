var express = require('express');
var router = express.Router();
var User = require('../models/user');
var TrackList = require('../models/tracklist');
var Request = require('../models/request');
var IndoorLocation = require('../models/IndoorLocation');
var OutdoorLocation = require('../models/OutdoorLocation');
var moment = require('moment');

router.get('/inactive', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        console.log(req.user);
        if (!req.user.active) {
            res.render('caregiverinactive', {
                title: 'Not Activated',
                user: req.user
            });
        }
    }
});

/* GET dashboard home page. */ //unfinished
router.get('/dashboard', function (req, res, next) {
    
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        
        if (req.user.active) {
            
            User.findOne({
                username: req.user.username
            }, function (err, user) {
                if (err) throw err;
                
                if (user.userrole == 'caregiver') {
                    
                    //sent request by caregiver
                    Request
                    .find({
                        requeststatus : false,
                        caregiverid : user._id,
                        requestfrom : user._id
                    })
                    .populate('elderlyid')
                    .exec(function (err, sentrequest) {
                        if (err) throw err;
                        
                        if (sentrequest) {

                            //pending request
                            Request
                            .find({
                                requeststatus : false,
                                caregiverid : user._id,
                                requestfrom : { $ne: user._id }
                            })
                            .populate('elderlyid')
                            .exec(function (err, pendingrequest) {
                                if (err) throw err;
                                
                                if (pendingrequest) {
                                    

                                    //monitorlist
                                    TrackList
                                    .find({ caregiverid : user._id })
                                    .populate('elderlyid outdoor')
                                    .deepPopulate('indoor.zoneid')
                                    .exec(function (err, tracklist) {
                                        if (err) throw err;
                                        if (tracklist.length > 0) {
                                            
                                            tracklist.forEach(function (item) {
                                                //console.log(item);
                                                var now = moment();
                                                
                                                if (item.indoor != null && item.outdoor != null) {


                                                    //check latest position
                                                    if (moment(item.indoor.timestamp).isBefore(moment(item.outdoor.timestamp))) {
                                                        //return outdoor is latest
                                                        item.latestposition = 'outdoor';
                                                        //check status elderly

                                                        //console.log(now.to(moment(item.outdoor.timestamp)));
                                                        item.status = now.to(moment(item.outdoor.timestamp));
                                                        console.log(item);


                                                    } else {
                                                        //return indoor is latest
                                                        item.latestposition = 'indoor';

                                                        item.status = now.to(moment(item.indoor.timestamp));

                                                    }
                                                    



                                                } else if (item.indoor != null && item.outdoor == null) {
                                                    item.latestposition = 'indoor';
                                                    item.status = now.to(moment(item.indoor.timestamp));

                                                } else if (item.indoor == null && item.outdoor != null) {
                                                    item.latestposition = 'outdoor';
                                                    item.status = now.to(moment(item.outdoor.timestamp));

                                                } else {
                                                    item.latestposition = '--';
                                                    item.status = '--';
                                                }
                                                
                                                

                                                if (tracklist[tracklist.length - 1]._id == item._id) {

                                                    rendercall(tracklist, sentrequest, pendingrequest);
                                                }
                                            });

                                        } else {
                                            rendercall(tracklist, sentrequest, pendingrequest);
                                        }
                    
                                    });
                                }

                            });
                        }

                    });

                    
                    
                    function rendercall(list, sentrequest, pendingrequest) {
                        //console.log(list);
                        res.render('caregiverdashboard', {
                            title: 'Caregiver Dashboard',
                            user: user,
                            trackList: list,
                            sentrequest: sentrequest,
                            pendingrequest : pendingrequest
                        });
                    };

                } else {
                    //render admin authorize not allow redirect to user dashboard
                    res.render('unauthorized', {
                        redirect: '/', 
                        title: 'Unauthorized',
                        message: 'unauthorized user!'
                    });
                }

            });
        } else {
            res.redirect('/caregiver/inactive');
        }
    }
});

/* GET active caregiver from email click */
router.get('/active/:id', function (req, res, next) {
    
    User.findById(req.params.id, function (err, user) {
        if (err) throw err;
        if (user) {
            
            user.active = true;
            user.save(function (err) {
                
                if (err) throw err;
                
                res.redirect('/login/2');
            });


        }
    })


});

/* GET accept request */
router.get('/acceptrequest/:id', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {

        Request
        .findById(req.params.id, function (err, request) {
            if (err) throw err;
            if (request) {
                request.requeststatus = true;
                
                request.save(function (err) {
                    if (err) throw err;
                    
                    var tl = new TrackList({
                        caregiverid : request.caregiverid,
                        elderlyid : request.elderlyid,
                        relationship : request.relationship
                    });
                    
                    tl.save(function (err) {
                        if (err) throw err;
                        
                        if(req.user.userrole =='caregiver')
                            res.redirect('/caregiver/dashboard');
                        else if (req.user.userrole == 'admin')
                            res.redirect('/admin/dashboard');


                    });


                });
            }
        });

    }
});

/* GET send request */
router.get('/sendrequest/:id', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        
        User.findById(req.params.id, function (err, user) {
            if (err) throw err;
            if (user) {
                res.render('caregiversendrequest', {
                    title: 'Send Request',
                    user : req.user,
                    elderly : user
                });
            } else {
                res.render('caregiversendrequest', {
                    title: 'Send Request',
                    user : req.user,
                    info : "elderly not found. Please contact admin."
                });
            }
        })
        
        
    }
});

/* POST send request */
router.post('/sendrequest', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        //console.log(req.body);
        
        
        var request = new Request({
            caregiverid: req.body.caregiverid,
            elderlyid: req.body.elderlyid,
            relationship: req.body.relationship,
            requestfrom: req.body.caregiverid
        });
        
        request.save(function (err) {
            if (err) {
                throw err;
                console.log("track list save err : ", err);
                
                return res.render('caregiversendrequest', {
                    title: 'Send Request',
                    info: "Sorry. Relationship save error occur. Contact admin."
                });

            } else {
                res.redirect('/caregiver/dashboard');
            }

        });
    }
});

/* GET search elderly */
router.get('/searchelderly', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        
        if (req.user.userrole == 'admin') {
            TrackList
            .find()
            .populate('elderlyid caregiverid')
            .exec(function (err, tracklist) {
                console.log(tracklist);
                
                res.render('searchelderly', {
                    title: 'Search Elderly',
                    user : req.user,
                    tracklist : tracklist
                });
            });
        } else {
            
            //caregiver
            User.find({
                userrole : 'elderly'
            }, function (err, users) {
                
                var list = [];
                
                if (users) {

                    users.forEach(function (user) {

                        TrackList
                        .findOne({
                            caregiverid : req.user._id,
                            elderlyid : user._id
                        }, function (err, tl) {
                            if (err) throw err;
                            if (tl) {
                                //console.log(tl);
                            } else {
                                list.push(user);
                            }
                            
                            if (users[users.length - 1]._id == user._id) {
                                caregiverrendercall(list);
                            }

                        });

                    });
                    
                    function caregiverrendercall(ulist) {
                        //console.log(ulist);
                        res.render('searchelderly', {
                            title: 'Search Elderly',
                            user: req.user,
                            userlist: ulist
                        });
                    };

                }
            });
        }
    }
});

/* POST search elderly */
router.post('/searchelderly', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        console.log('term:' + req.body.s);
        var search_term = req.body.s;

        if (req.user.userrole == 'admin') {
            TrackList
            .find()
            .populate('elderlyid caregiverid')
            .exec(function (err, tracklist) {
                //console.log(tracklist);
                
                //res.render('searchelderly', {
                //    user : req.user,
                //    tracklist : tracklist
                //});
                var list = [];
                
                tracklist.forEach(function (entry) {
                    
                    if (entry.elderlyid.userfullname.includes(search_term)) {
                        list.push(entry);
                    }
                    
                    if (tracklist[tracklist.length - 1]._id == entry._id) {
                        res.render('searchelderly', {
                            title: 'Search Elderly',
                            user : req.user,
                            tracklist : list
                        });
                    }

                });
            


            });
        } else {

            User.find({
                userrole : 'elderly'
            }, function (err, users) {

                var list = [];
                
                if (users) {

                    users.forEach(function (user) {
                        
                        TrackList
                        .findOne({
                            caregiverid : req.user._id,
                            elderlyid : user._id
                        }, function (err, tl) {
                            if (err) throw err;
                            
                            

                            if (tl) {
                                //console.log(tl);
                            } else {
                                
                                if (user.userfullname.includes(search_term)) {
                                    //console.log('st:', user.userfullname);
                                    list.push(user);
                                }
                            }
                            
                            if (users[users.length - 1]._id == user._id) {
                                console.log(list);
                                res.render('searchelderly', {
                                    title: 'Search Elderly',
                                    user : req.user,
                                    userlist : list,
                                    search_term : search_term
                                });
                            }

                        });

                    });

                }


            });


        }
        
        //User.find({
        //    userrole: 'elderly',
        //    userfullname: { "$regex": search_term, "$options": "" }
        //}, function (err, elderlylist) {
            
        //    //console.log('result:' + elderlylist);
        //    //res.render('searchelderly', {
        //    //    user : req.user,
        //    //    trackList : elderlylist
        //    //});

        //});
        
    }
});

/* GET add elderly */
router.get('/addelderly', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        
        res.render('addelderly', {
            user : req.user,
            url : '/caregiver/addelderly',
            own: false
        });


    }
});

/* POST add elderly */
router.post('/addelderly', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        
        //console.log(req.user);
        
        User.register(new User({
            username : req.body.username,
            userrole : "elderly",
            userfullname : req.body.full_name,
            useremail : req.body.email,
            usercontact : req.body.phone,
            useraddress : req.body.address,
            userpostcode : req.body.postcode,
            userstate : req.body.state,
            usercountry : req.body.country,
            userhomelat : req.body.latitude,
            userhomelng : req.body.longitude
        }), req.body.password, function (err, user) {
            if (err) {
                console.log('err register elderly ', err);
                return res.render('addelderly', {
                    info: "Sorry. That username already exists. Try again."
                });
            }
            
            console.log("new elderly created : ", user);
            
            var request = new Request({
                caregiverid: req.user._id,
                elderlyid: user._id,
                relationship: req.body.relationship,
                requestfrom: req.user._id
            });
            
            request.save(function (err) {
                if (err) {
                    throw err;
                    console.log("request save err : ", err);
                    
                    return res.render('addelderly', {
                        info: "Sorry. request save error occur. Contact admin."
                    });

                }
            });
            
            if (req.user.userrole == "admin") {
                res.redirect('/admin/dashboard');
            } else {
                res.redirect('/caregiver/dashboard');
            }


        });


    }
});

/* GET show map location elderly */
router.get('/elderlylocation/:lat/:lng', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        res.render('elderlylocation', {
            user : req.user,
            lat : req.params.lat,
            lng : req.params.lng
        });
    }
});

module.exports = router;
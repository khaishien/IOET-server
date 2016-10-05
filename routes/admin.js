var express = require('express');
var router = express.Router();
var User = require('../models/user');
var TrackList = require('../models/tracklist');
var moment = require('moment');
var Request = require('../models/request');

/* GET dashboard home page. */
router.get('/dashboard', function (req, res, next) {
    
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        
        if (req.user.userrole != 'admin') {
            res.redirect('/');
        } else {
            
            //find caregiver
            User.find({
                userrole: 'caregiver'
            }, function (err, caregiverlist) {
                if (err) throw err;
                if (caregiverlist) {
                    
                    //find elderly
                    User.find({
                        userrole: 'elderly'
                    }, function (err, elderlylist) {
                        if (err) throw err;
                        if (elderlylist) {
                            
                            //find request
                            Request
                            .find({ requeststatus : false })
                            .populate('caregiverid elderlyid requestfrom')
                            .exec(function (err, request) {
                                if (err) throw err;
                                if (request) {
                                    
                                    //own reqeust pending
                                    Request
                                    .find({
                                        requeststatus : false,
                                        caregiverid : req.user._id,
                                        requestfrom : { $ne: req.user._id }
                                    })
                                    .populate('elderlyid')
                                    .exec(function (err, ownpendingrequest) {
                                        if (err) throw err;
                                        if (ownpendingrequest) {
                                            
                                            Request
                                            .find({
                                                requeststatus : false,
                                                caregiverid : req.user._id,
                                                requestfrom : req.user._id
                                            })
                                            .populate('elderlyid')
                                            .exec(function (err, ownsentrequest) {
                                                if (err) throw err;
                                                if (ownsentrequest) {
                                                    
                                                    
                                                    
                                                    //find tracklist
                                                    TrackList
                                                    .find()
                                                    .populate('caregiverid elderlyid outdoor')
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
                                                                    rendercall(caregiverlist, elderlylist, tracklist, request, ownpendingrequest, ownsentrequest);
                                                                }
                                                            });

                                                        } else {
                                                            rendercall(caregiverlist, elderlylist, tracklist, request, ownpendingrequest, ownsentrequest);
                                                        }
                                                    });
                                                    
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
            function rendercall(caregiverlist, elderlylist, tracklist, request, ownpendingrequest, ownsentrequest){

                res.render('admindashboard', {
                    title: 'Admin Dashboard',
                    user: req.user,
                    caregiverlist : caregiverlist,
                    elderlylist : elderlylist,
                    tracklist : tracklist,
                    request : request,
                    ownpendingrequest : ownpendingrequest,
                    ownsentrequest : ownsentrequest
                });

            }
        }
    }
});

/* GET admin delete user */
router.get('/delete/:userid', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        
        if (req.user.userrole != 'admin') {
            res.redirect('/');
        } else {
            
            User.findById(req.params.userid, function (err, user) {
                if (err) throw err;
                if (user) {
                    
                    if (user.userrole == 'elderly') {
                        
                        TrackList.remove({
                            elderlyid : req.params.userid
                        }, function (err) {
                            if (err) throw err;
                        });
                        
                        user.remove(function (err) {
                            if (err) throw err;
                        });
                        
                        
                        res.redirect('/admin/dashboard');
                    } else if (user.userrole == 'caregiver') {
                        
                        TrackList.remove({
                            caregiverid : req.params.userid
                        }, function (err) {
                            if (err) throw err;
                        });
                        
                        user.remove(function (err) {
                            if (err) throw err;
                        });
                        
                        res.redirect('/admin/dashboard');
                    }

                }
            })

        }
    }
});


module.exports = router;
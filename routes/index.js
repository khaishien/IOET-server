var express = require('express');
var passport = require('passport');
var User = require('../models/user');
var Tracklist = require('../models/tracklist');
var IndoorLocation = require('../models/IndoorLocation');
var OutdoorLocation = require('../models/OutdoorLocation');
var IndoorZone = require('../models/indoorzone');
var Notification = require('../models/notification');
var Tag = require('../models/tag');
var Request = require('../models/request');
var router = express.Router();
var multer = require('multer');
var upload = multer({ dest: 'public/images/profile/' });
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'kslau1992@gmail.com', // Your email id
        pass: 'Lk$92game' // Your password
    }
});

// random password
function randomPassword() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
    for (var i = 0; i < 12; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    
    return text;
}

router.post('/halo', function (req, res, next) {
    console.log(req.body);
    res.send({
        Name : "halo world"
    });
});

router.get('/resetdb/134679', function (req, res, next) {
    //reset db by dropping
    //db:
    //users
    //tracklists
    
    User.remove({}, function (err) {
        console.log('User collection removed')

        User.register(new User({
            username : 'admin',
            userrole : 'admin',
            userfullname : 'admin',
            active : true
        }), 'admin', function (err, user) {
            if (err) {
                console.log('err register admin ', err);
            }
            console.log('register admin success!');
            res.redirect('/login');
        });

    });
    
    Tracklist.remove({}, function (err) {
        console.log('Tracklist collection removed');
    });

    IndoorLocation.remove({}, function (err) {
        console.log('indoor location collection removed');
    });
    
    OutdoorLocation.remove({}, function (err) {
        console.log('outdoor location collection removed');
    });

    IndoorZone.remove({}, function (err) {
        console.log('indoor zone collection removed');
    });

    Notification.remove({}, function (err) {
        console.log('notification collection removed');
    });
    
    Tag.remove({}, function (err) {
        console.log('tag collection removed');
    });
    
    Request.remove({}, function (err) {
        console.log('request collection removed');
    });

});

/* GET login */
router.get('/login', function (req, res, next) {
    
    res.render('login', {
        title : 'login'
    });
});

router.get('/login/:code', function (req, res, next) {
    if (req.params.code == "1") {
        res.render('login', {
            title : 'login',
            info : "please wait for admin for activate the account"
        });
    } else if (req.params.code == '2') {
        res.render('login', {
            title : 'login',
            info : "Activate account successful, login to proceed."
        });
    } else {
        res.render('login', {
            title : 'login'
        });
    }
    
    
});

/* POST login */
router.post('/login', passport.authenticate('local'), function (req, res, next) {
    
    User.findOne({
        username: req.body.username
    }, function (err, user) {
        if (err) throw err;
        
        var currentDate = new Date();
        user.login_at = currentDate;
        
        //update user login date
        user.save(function (err) {
            if (err) throw err;
            
            if (user.userrole == 'admin') {
                res.redirect('/admin/dashboard');
                console.log("log in as admin");
            } else if (user.userrole == 'caregiver') {
                //res.redirect('/caregiver/dashboard');
                if (user.active == false) {
                    res.redirect('/caregiver/inactive');
                } else {
                    res.redirect('/caregiver/dashboard');
                }
                console.log("log in as caregiver");
            } else if (user.userrole == 'elderly') {
                res.redirect('/profile/' + user._id);
                console.log("log in as elderly");
            }
        });
    });
});

/* GET Logout */
router.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});

/* GET register caregiver */
router.get('/register', function (req, res, next) {
    res.render('register', {
        title : 'register'
    });
});

/* GET register elderly */
router.get('/elderly/register', function (req, res, next) {
    res.render('addelderly', {
        title : 'elderly register',
        url : '/elderly/register',
        own : true
    });
});

/* POST register elderly */
router.post('/elderly/register', function (req, res, next) {
    
    //console.log(req.body);
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
            console.log('err register elderly', err);
            return res.render("register", {
                info: "Sorry. That username already exists. Try again."
            });
        }
        
        
        
        console.log("new elderly created : ", user);
        
        res.redirect('/login/1');

        
    });
});

/* GET delete user */
router.get('/elderly/delete/:id', function (req, res, next) {

});

/* POST register caregiver */
router.post('/register', function (req, res, next) {
    
    //console.log(req.body);
    User.register(new User({
        username : req.body.username,
        userrole : "caregiver",
        userfullname : req.body.full_name,
        useremail : req.body.email,
        usercontact : req.body.phone,
        useraddress : req.body.address,
        userpostcode : req.body.postcode,
        userstate : req.body.state,
        usercountry : req.body.country
    }), req.body.password, function (err, user) {
        if (err) {
            console.log('err register ', err);
            return res.render("register", {
                info: "Sorry. That username already exists. Try again."
            });
        }
        
        
        
        console.log("new caregiver created : ", user);
        
        res.redirect('/login/1');

        
    });
});

/* GET active caregiver */
router.get('/activecaregiver/:id', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        var id = req.params.id;
        
        User.findById(id, function (err, user) {
            if (err) throw err;
            if (user) {
                
                //send active email
                //var mailOptions = {
                //    from: 'ADMIN IOET <kslau1992@gmail.com>', // sender address
                //    to: user.useremail, // list of receivers
                //    subject: 'Activated Caregiver Account', // Subject line
                //    text: 'Username : ' + user.username + ' Caregiver account activated.' , // plaintext body
                //    html: '<h1>Active caregiver</h1><p>Username: ' + user.username + '</p><p>Caregiver account activated.</p>' // html body
                //};
                
                //transporter.sendMail(mailOptions, function (error, info) {
                //    if (error) {
                //        return console.log(error);
                //    }
                //    console.log('Message sent: ' + info.response);
        
                //});
                
                user.active = true;
                user.save(function (err) {
                    
                    if (err) throw err;
                    
                    res.redirect('/admin/dashboard');

                });

                

            }
        })

    }
});

/* GET profile */
router.get('/profile/:id', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        //console.log(req.user);
        
        if (req.user._id == req.params.id) {

            User.findById(req.params.id, function (err, user) {
                console.log(user);
                res.render('profile', {
                    title: user.userfullname,
                    user : req.user,
                    profile : user
                });
            });

        } else {
            if (req.user.username == 'admin') {

                User.findById(req.params.id, function (err, user) {
                    console.log(user);
                    res.render('profile', {
                        title: user.userfullname,
                        user : req.user,
                        profile : user
                    });
                });

            } else {
                res.redirect('/caregiver/dashboard');
            }
            
        }
        
        
    }
});

/* GET update profile */
router.get('/update/:id', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        
        User.findById(req.params.id, function (err, user) {
            //console.log(user);
            res.render('updateprofile', {
                title: 'Update profile',
                user: user
            });
        });
    }
});

/* POST update profile */
router.post('/update/:id', function (req, res, next) {
    
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        User.findById(req.params.id, function (err, user) {
            
            //console.log(user);
            var currentDate = new Date();
            user.login_at = currentDate;
            user.updated_at = currentDate;
            user.userfullname = req.body.full_name;
            user.useremail = req.body.email;
            user.usercontact = req.body.phone;
            user.useraddress = req.body.address;
            user.userpostcode = req.body.postcode;
            user.userstate = req.body.state;
            
            user.save(function (err) {
                if (err) {
                    console.log('err update', err);
                    return res.render("updateprofile", {
                        user: user,
                        info: "Sorry. That username already exists. Try again."
                    });
                }
                
                res.redirect('/profile/' + user._id);
            
            
            //passport.authenticate('local')(req, res, function () {
            //    res.redirect('/profile/' + user._id);
            ////res.redirect('/');
            //});
            });

        });
    }
    

});

/* GET update profile picture */
router.get('/updateprofilepic/:id', function (req, res, next) {
    if (!req.isAuthenticated) {
        res.redirect('/login');
    } else {
        
        User.findById(req.params.id, function (err, user) {
            //console.log(user);
            res.render('updateprofilepic', {
                title: 'Update profile picture',
                user: user
            });
        });
    }
});

/* POST update profile picture */
router.post('/updateprofilepic/:id', upload.single('profilepic'), function (req, res, next) {
    
    if (!req.isAuthenticated) {
        res.redirect('/login');
    } else {
        //res.send(req.file);
        var file = req.file;
        console.log(file);
        User.findById(req.params.id, function (err, user) {
            user.userprofilepic = file.filename;
            
            user.save(function (err) {
                if (err) {
                    console.log('err update profile picture', err);
                    return res.render("updateprofilepic", {
                        user: user,
                        info: "Sorry. Error occur when upload image. Try again."
                    });
                }
                
                res.redirect('/profile/' + user._id);
            });



        });

        
    }
});

/* GET forgot password */
router.get('/resetpassword', function (req, res, next) {
    res.render('resetpassword', {
        title: 'Reset password'
    });
});

/* POST forgot password */
router.post('/resetpassword', function (req, res, next) {
    //res.send(req.body);
    var emailFilter = /^([a-zA-Z0-9_.-])+@(([a-zA-Z0-9-])+.)+([a-zA-Z0-9]{2,4})+$/;
    var input = req.body.resetpasswordinput;
    if (emailFilter.test(input)) {
        //is email
        User.findOne({
            useremail : input
        }, function (err, user) {
            if (err) {
                res.render('changepassword', {
                    info: 'the email is not found.'
                });
                return;
            }
            
            if (user) {
                var email = user.useremail;
                var newPass = randomPassword();
                
                //send email
                var mailOptions = {
                    from: 'ADMIN IOET ? <kslau1992@gmail.com>', // sender address
                    to: email, // list of receivers
                    subject: 'Reset Password', // Subject line
                    text: 'Username : ' + user.username + ' New Password :' + newPass, // plaintext body
                    html: '<h1>Reset Password</h1><p>Username: ' + user.username + '</p><p>New password: ' + newPass + '</p>' // html body
                };
                
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: ' + info.response);

                });
                
                
                user.setPassword(newPass, function (err) {
                    if (err) console.log("chg pass err: ", err);
                    
                    user.save();
                    res.render('resetpassword', {
                        info: 'Email sent to ' + user.useremail + '. Please check the reset password.'
                    });

                });
            } else {
                res.render('changepassword', {
                    info: 'the email is not found.'
                });
            }

        });

    } else {
        //not email
        User.findOne({
            username: input
        }, function (err, user) {
            if (err) {
                res.render('changepassword', {
                    info: 'the username is not found.'
                });
                return;
            }
            
            if (user) {
                var email = user.useremail;
                var newPass = randomPassword();
                
                //send email
                var mailOptions = {
                    from: 'ADMIN IOET ? <kslau1992@gmail.com>', // sender address
                    to: email, // list of receivers
                    subject: 'Reset Password', // Subject line
                    text: 'Username : ' + user.username + ' New Password :' + newPass, // plaintext body
                    html: '<h1>Reset Password</h1><p>Username: ' + user.username + '</p><p>New password: ' + newPass + '</p>' // html body
                };
                
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: ' + info.response);

                });
                
                
                user.setPassword(newPass, function (err) {
                    if (err) console.log("chg pass err: ", err);
                    
                    user.save();
                    res.render('resetpassword', {
                        info: 'Email sent to ' + user.useremail + '.Please check the reset password.'
                    });

                });
            }


        });

    }

});

/* GET change password */
router.get('/changepassword/:id', function (req, res, next) {
    if (!req.isAuthenticated) {
        res.redirect('/login');
    } else {
        
        User.findById(req.params.id, function (err, user) {
            //console.log(user);
            res.render('changepassword', {
                title: 'Change password',
                user: user
            });
        });
    }

    
});

/* POST change password */
router.post('/changepassword/:id', function (req, res, next) {
    if (!req.isAuthenticated) {
        res.redirect('/login');
    } else {
        var newPass = req.body.password;
        
        User.findById(req.params.id, function (err, user) {
            if (user) {
                user.setPassword(newPass, function (err) {
                    if (err) console.log("chg pass err: ", err);
                    
                    user.save();
                    res.redirect('/profile/' + user._id);

                });
            }
        });
    }
});

/* GET home page. */
router.get('/', function (req, res, next) {
    //console.log("user: --", req.user);
    if (!req.isAuthenticated()) {
        res.render('index', {
            index : true,
            title: 'IOET'
        });
    } else {
        res.render('index', {
            index : true,
            user : req.user,
            title: 'IOET'
        });
    }
        
});

module.exports = router;

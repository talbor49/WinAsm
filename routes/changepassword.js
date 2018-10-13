var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var {Client } = require('pg');


router.post('/', function(req, res) {
    'use strict';
    console.log("Got request to change password");
    Client.connect(process.env.DATABASE_URL, function(err, connection, done) {
        if (err) {
            done();
            console.log("Error in creating connection to database: " + err);
            res.json({"code": 100, "status": "Error in connection database"});
        } else {
            var username = req.session.username;

            connection.query("select * from users where username='" + username + "';", function (err, rows) {
                if (!err) {
                    var extra = getExtra(req);
                    var oldpass = req.body.old;
                    var salt = rows[0].salt;
                    var saltpassword = oldpass + salt;
                    var hashedpassword = crypto.createHash('md5').update(saltpassword).digest('hex');
                    if (rows[0].hashed !== hashedpassword) {
                        res.render('userpanel', { title: 'User Panel', extra:extra, username:req.session.username, error:"Invalid old password"});
                        return;
                    }
                    if (req.body.password !== req.body.verifypassword) {
                        res.render('userpanel', { title: 'User Panel', extra:extra, username:req.session.username, error:"Password do not match"});
                        return;
                    }
                    var newpass = req.body.password;
                    salt = rows[0].salt;
                    saltpassword = newpass + salt;
                    hashedpassword = crypto.createHash('md5').update(saltpassword).digest('hex');

                    connection.query("UPDATE users SET hashed=" + "'" + hashedpassword + "'" + " where username='" + username + "';", function (err) {
                        if (err) {
                            console.log("Error occured in changing passwords: " + err);
                        }
                    });
                    res.render('userpanel', { title: 'User Panel', extra:extra, username: req.session.username, error: "Password change success." });
                } else {
                    console.log("error in accessing database in changepassword: " + err);
                }
                done();
            });
        }
    });

});

module.exports = router;
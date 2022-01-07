//! envirement varibles to keep secrets
require('dotenv').config()


const express = require("express");
const bodyParser = require("body-parser");
const lodash = require('lodash');
/* const daye = require(__dirname + "/data.js") */
let ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const app = express();
const session = require("express-session");
const passport = require("passport");
const passportLocal = require("passport-local");
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate')
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'aissa_M9wde',
  resave: false,
  saveUninitialized: false,
  
}))
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
//Using bod-parser
app.use(bodyParser.urlencoded({extended:true}));
//The public folder which holds the CSS
app.use(express.static("public"));
//! connect to mongoose
mongoose.connect('mongodb://localhost:27017/secretDb');
//! scehma
const peopleSchema = new mongoose.Schema({
    username :String,
    Password: String,
    googleId : String,
    secret : String

});

peopleSchema.plugin(passportLocalMongoose);
peopleSchema.plugin(findOrCreate);
//! encryption par une mot en secret ----- level2 of sécurity
/* var secret = process.env.SECRET;
peopleSchema.plugin(encrypt, { secret: secret , encryptedFields: ["Password"] });
 */

//! hashing passwords  -------- level 3 of sécurity
const md5 = require('md5');

//!  hashing and salt ------ levl 4 of sécurity
const bcrypt = require('bcrypt');
const saltRounds = 10;

const People = mongoose.model("People",peopleSchema); 

passport.use(People.createStrategy());

/* passport.serializeUser(People.serializeUser());
passport.deserializeUser(People.deserializeUser()); */
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  
  function(accessToken, refreshToken, profile, cb) {
    People.findOrCreate({ googleId: profile.id }, function (err, user) {
        console.log(profile);
      return cb(err, user);

    });
  }
));
console.log(process.env.GOOGLE_CLIENT_ID);

app.get("/" , function(req,res){
    res.render("home")
})
app.get("/register" , function(req,res){
    res.render("register")
});



//!   --------------------------------------------------max sécurity 4 ---------------------------------------------




/* app.post("/register" , function(req,res){
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
   
        //! insert elements into mongodb
        const people = new People({
  
            Name : req.body.username ,
            //! use of md5 to hash password
        //    Password : md5(req.body.password) 
            //! use hash and salt 
            Password : hash
        })
        
        people.save(function(err){
            if(err) res.send(err);
            else res.render("secrets")
        });
    });
        // res.redirect("/") 
});
 //! login post 

app.post("/login" , function(req,res){
    //! insert elements into mongodb
    const username = req.body.username;
    //! hash methode
 //    const password = md5(req.body.password); 
    const password = req.body.password;
    People.findOne({Name:username},function(err,articleFound){
        if(err) console.log(err);
        else {
            

                //if(elt.Name === username && elt.Password === password){ 
                    bcrypt.compare(password, articleFound.Password, function(err, result) {
                        if(result === true) res.render("secrets")
                        console.log(password);
                    });
                   
                    
            }
        });

    // res.redirect("/") 
}); */



//! -------------------------------------------------------------------- 5 level of sécurity cockies and sessions --------------------------------------

app.post('/register', function(req, res) {

    People.register({username: req.body.username,active: false}, req.body.password, function(err, user) {
        if (err) { 
            console.log(err);
            res.redirect("/register")
        }
      
        else {
         passport.authenticate("local") (req ,res ,function() {
         
            res.redirect("/secrets")
          // Value 'result' is set to false. The user could not be authenticated since the user is not active
        });}
      });
});
app.get("/secrets", function(req, res) {
    People.find({"secret": {$ne:null}} ,function(err,userFound){
        if(err) res.send(err);
        else {
            if(userFound) res.render("secrets" , {userFound: userFound});
        }
            
        });
});

app.post("/login", function(req, res) {
    const user = new People({
        username: req.body.username,
        Password: req.body.password
    })

    
    req.login(user, function(err) {
        if (err) { console.log(err); }
        return res.redirect("/secrets");
      });

});

app.get('/logout', function(req, res) {
 req.logout();
 res.redirect("/")
})




//! ---------------------------------------------------------------- login and submit -------------------------------- --------

app.get("/login" , function(req,res){
    res.render("login")
});

app.get("/submit" , function(req,res){
    res.render("submit")
});



//! ------------------------------ connect and login using google ----------------------------------------------------------------

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

 

  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

//! ------------------------------------------------------------------------ submit the secrets -----------------------------------------
app.get("/submit" , function(req,res){
    if(req.isAuthenticated()) {
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
})
app.post("/submit", function(req,res){
    const mySecret = req.body.secret;
    console.log(req.user._id);
    People.findById(req.user._id, function(err,foundPeople){
        if(err){  res.redirect("/login")}
        else{
            if(foundPeople){
                foundPeople.secret = mySecret;
                foundPeople.save(function(){
                    res.redirect("/secrets")
                });
            }

        }
    })
})

 

 //! listen to port 3000 or Port aléatoire   
 app.listen(process.env.PORT||3000,function () {
    console.log("Server is running at port 3000");
   });

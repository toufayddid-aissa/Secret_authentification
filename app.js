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
app.set('view engine', 'ejs');
//Using bod-parser
app.use(bodyParser.urlencoded({extended:true}));
//The public folder which holds the CSS
app.use(express.static("public"));
//! connect to mongoose
mongoose.connect('mongodb://localhost:27017/secretDb');
//! scehma
const peopleSchema = new mongoose.Schema({
    Name :String,
    Password: String

});

//! encryption par une mot en secret
var secret = process.env.SECRET;
peopleSchema.plugin(encrypt, { secret: secret , encryptedFields: ["Password"] });

const People = mongoose.model("People",peopleSchema); 

app.get("/" , function(req,res){
    res.render("home")
})
app.get("/register" , function(req,res){
    res.render("register")
});
app.post("/register" , function(req,res){
        //! insert elements into mongodb
        const people = new People({
  
            Name : req.body.username ,
            Password : req.body.password
        })
        
        people.save(function(err){
            if(err) res.send(err);
            else res.render("secrets")
        });
        /* res.redirect("/") */
});
 //! login post 

app.post("/login" , function(req,res){
    //! insert elements into mongodb
    const username = req.body.username;
    const password = req.body.password;
    People.find(function(err,articleFound){
        if(err) console.log(err);
        else {
            const peoples = articleFound;
            peoples.forEach(function(elt){
                if(elt.Name === username && elt.Password === password){
                    res.render("secrets")
                    console.log(elt.Password);
                }
                
            })
            
        }
        })

    /* res.redirect("/") */
});
app.get("/login" , function(req,res){
    res.render("login")
});

app.get("/submit" , function(req,res){
    res.render("submit")
});




 //! listen to port 3000 or Port aléatoire   
 app.listen(process.env.PORT||3000,function () {
    console.log("Server is running at port 3000");
   });

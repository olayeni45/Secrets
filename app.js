//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const app = express();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const saltRounds = 10;

app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"));
app.set('view engine', 'ejs');

//User Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

//User Model
const User = mongoose.model("User", userSchema);

//Routes
app.get('/', (req, res) => {
    res.render('home');
})


//Login Route
app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username }, (err, user) => {

        if (err) {
            console.log(err);
        }
        else {
            if (user) {
                bcrypt.compare(password, user.password, function (err, result) {
                    if (result === true) {
                        res.render('secrets')
                    }
                });
            }
        }
    })
})


//Register route
app.get('/register', (req, res) => {
    res.render('register');
})

app.post('/register', (req, res) => {

    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {

        // Store hash in your password DB.
        const newUser = new User({
            email: req.body.username,
            password: hash
        })

        newUser.save((err) => {
            if (err) {
                console.log(err)
            }
            else {
                res.render('secrets');
            }
        })
    });

})


const port = process.env.PORT | 3000;

app.listen(port, () => {
    console.log(`Server running on Port ${port}`)
})
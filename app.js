//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const md5 = require('md5');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"));
app.set('view engine', 'ejs');


//User Schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
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
    const password = md5(req.body.password);
    //md5 was used here to hash the password so the hashed version of
    //both passwords would be compared.

    User.findOne({ email: username }, (err, user) => {

        if (err) {
            console.log(err);
        }
        else {
            if (user) {
                if (user.password === password) {
                    res.render('secrets')
                }
            }
        }
    })
})


//Register route
app.get('/register', (req, res) => {
    res.render('register');
})

app.post('/register', (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    })

    newUser.save((err) => {
        if (err) {
            console.log(err)
        }
        else {
            res.render('secrets');
        }
    })
})


const port = process.env.PORT | 3000;

app.listen(port, () => {
    console.log(`Server running on Port ${port}`)
})
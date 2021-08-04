//jshint esversion:6
const express = require('express');
require('dotenv').config();
const ejs = require('ejs');
const encrypt = require('mongoose-encryption');

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

//Using the mongoose-encryption package - Always use the plugin for the encryption
//before creating a model
userSchema.plugin(encrypt, { secret: process.env.ENCRYPTION_KEY, encryptedFields: ['password'] });

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
        password: req.body.password
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
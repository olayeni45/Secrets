//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const app = express();

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require('passport-local-mongoose');

app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect("mongodb://localhost:27017/secrets", { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set("useCreateIndex", true)


//User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String
})

userSchema.plugin(passportLocalMongoose);

//User Model
const User = mongoose.model("User", userSchema);

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Routes
app.get('/', (req, res) => {
    res.render('home');
})


//Login Route
app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);

        }
        else {
            passport.authenticate("local")(req, res, () => {
                res.redirect('/secrets');
            })
        }
    })

})

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
})


//Secrets page
app.get('/secrets', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('secrets');
    }
    else {
        res.redirect('/login');
    }
})

//Register route
app.get('/register', (req, res) => {
    res.render('register');
})

app.post('/register', (req, res) => {

    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect('/register');
        }
        else {
            passport.authenticate("local")(req, res, () => {
                res.redirect('/secrets');
            })
        }
    })

})


const port = process.env.PORT | 3000;

app.listen(port, () => {
    console.log(`Server running on Port ${port}`)
})
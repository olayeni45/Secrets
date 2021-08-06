//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const app = express();

//Session and Passport Local imports
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require('passport-local-mongoose');

//Passport Oauth and custom mongoose Imports
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

//Body Parser, public folder and view engine settings
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"));
app.set('view engine', 'ejs');

//session, initialize Passport and passport session
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true)


//User Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//User Model
const User = mongoose.model("User", userSchema);

//These configurations for passport must be kept after the User schema and model
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

//Google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        // console.log("Google Profile", profile);
        User.findOrCreate({ googleId: profile.id, email: profile.emails[0].value }, function (err, user) {
            return cb(err, user);
        });
    }
));

//Facebook strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        // console.log("Facebook profile", profile)
        User.findOrCreate({ facebookId: profile.id, }, function (err, user) {
            return cb(err, user);
        });
    }
));

//Routes
app.get('/', (req, res) => {
    res.render('home');
})

app.get('/auth/google', passport.authenticate("google", { scope: ["profile", "email"] }));

app.get('/auth/google/secrets',
    passport.authenticate("google", { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });


app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/secrets', passport.authenticate('facebook', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });


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
    User.find({ "secret": { $ne: null } }, (err, foundUsers) => {
        if (err) {
            console.log(err);
        }
        else {
            if (foundUsers) {
                res.render('secrets', { usersWithSecrets: foundUsers })
            }
        }
    })
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


//Submit page
app.get('/submit', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('submit');
    }
    else {
        res.redirect('/login');
    }
})

app.post('/submit', (req, res) => {
    const submittedSecret = req.body.secret;

    console.log("User", req.user);
    const userId = req.user._id;
    User.findById(userId, (err, foundUser) => {
        if (err) {
            console.log(err);
        }
        else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(() => {
                    res.redirect('/secrets');
                })
            }
        }
    })
})

const port = process.env.PORT | 3000;

app.listen(port, () => {
    console.log(`Server running on Port ${port}`)
})
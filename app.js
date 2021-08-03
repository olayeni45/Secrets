//jshint esversion:6
const express = require('express');
require('dotenv').config();
const ejs = require('ejs');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"));
app.set('view engine', 'ejs');


const port = process.env.PORT | 3000;

app.listen(port, () => {
    console.log(`Server running on Port ${port}`)
})
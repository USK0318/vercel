const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./connect');

// Load environment variables
const port1 = process.env.SERVER_PORT || 3000;

// Connect to MongoDB
connectDB();


app.get('/', (req, res) => {
    res.send('Hello World');
});



app.listen(port1, () => {
    console.log('Server is running on port ' + port1);
});

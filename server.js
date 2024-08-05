const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./connect');

// Load environment variables
const port1 = process.env.SERVER_PORT || 3000;

// Connect to MongoDB
connectDB();

// Define User schema and model
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    // Add other fields as necessary
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.send('Hello World');
});

const userRouter = require('./routs/userRoute');
const noteRouter = require('./routs/noteRoute');

app.use('/users', userRouter);
app.use('/notes', noteRouter);



app.listen(port1, () => {
    console.log('Server is running on port ' + port1);
});

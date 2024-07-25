const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://uppalapatisaikiran27:20A25B0318@scutiarts.rifwbjg.mongodb.net/?retryWrites=true&w=majority&appName=scutiarts"
            , {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;

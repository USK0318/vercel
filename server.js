const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./connect');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables
const port1 = process.env.SERVER_PORT || 3000;
const secret = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json()); // for parsing application/json

// Connect to MongoDB
connectDB();

// Define User schema and model
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String, // Store hashed passwords
});
const NoteUser = mongoose.model('NoteUser', userSchema);

const notesSchema = new mongoose.Schema({
    title: String,
    content: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'NoteUser' },
    datetime: { type: Date, default: Date.now }
});
const Note = mongoose.model('Note', notesSchema);

// Authorization middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, secret, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Register User
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if the user already exists
        let user = await NoteUser.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        user = new NoteUser({
            name,
            email,
            password: hashedPassword
        });

        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
});

// Login User
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the user exists
        const user = await NoteUser.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ _id: user._id, name: user.name, email: user.email }, secret, { expiresIn: '1h' });

        res.json({ token, user: { name: user.name, email: user.email } });
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
});

// CRUD operations for Notes

// Create Note
app.post('/note', authenticateToken, async (req, res) => {
    try {
        const note = new Note({
            title: req.body.title,
            content: req.body.content,
            user: req.user._id
        });
        await note.save();
        res.status(201).json(note);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
});

// Read all Notes
app.get('/note', authenticateToken, async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user._id }).populate('user');
        res.json(notes);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
});

// Read single Note by ID
app.get('/note/:id', authenticateToken, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id).populate('user');
        if (!note || note.user._id.toString() !== req.user._id.toString()) {
            return res.status(404).send('Note not found');
        }
        res.json(note);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
});

// Update Note by ID
app.put('/note/:id', authenticateToken, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note || note.user._id.toString() !== req.user._id.toString()) {
            return res.status(404).send('Note not found');
        }
        note.title = req.body.title || note.title;
        note.content = req.body.content || note.content;
        await note.save();
        res.json(note);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
});

// Delete Note by ID
app.delete('/note/:id', authenticateToken, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note || note.user._id.toString() !== req.user._id.toString()) {
            return res.status(404).send('Note not found');
        }
        await note.deleteOne();
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
});

// Server listening
app.listen(port1, () => {
    console.log('Server is running on port ' + port1);
});

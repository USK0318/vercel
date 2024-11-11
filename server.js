const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./connect');
const cors = require('cors');
const bcrypt = require('bcrypt');
const token = require('jsonwebtoken');


const authenticateToken = (req, res, next) => {
    const token1 = req.headers['authorization'];

    if (!token1) {
        return res.sendStatus(401);
    }

    token.verify(token1, 'saikirNani@123', (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port1 = process.env.SERVER_PORT || 3000;

app.use(cors({
    origin: '*',
    credentials: true
}));

connectDB();

const userSchema = new mongoose.Schema({
    name: String,
    password: String,
    email: String,
    phone: Number
});
const NoteUser = mongoose.model('NoteUser', userSchema);

const notesSchema = new mongoose.Schema({
    title: String,
    content: String,
    user: String,
    viewedusers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NoteUser'
        }
    ],
    datetime: { type: Date, default: Date.now }
});
const Note = mongoose.model('Note', notesSchema);

app.get('/', (req, res) => {
    res.send('Hello World');
});

// Get users by id
app.get('/users/:id', authenticateToken, async (req, res) => {
    try {
        const user = await NoteUser.findById(req.params.id);
        const notescount = await Note.find({ user: req.params.id }).countDocuments();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user, notescount });
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all nots
app.get('/note', authenticateToken, async (req, res) => {
    try {
        const note1 = await Note.find();
        note1.reverse();
        res.json(note1);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
});

// Get a note by id
app.get('/note/:id', authenticateToken, async (req, res) => {
    try {
        const token1 = req.headers['authorization'];
        const userid = token.decode(token1).userId;
        const notetoappenduser = await Note.findById(req.params.id);
        if (!notetoappenduser.viewedusers.includes(userid)) {
            notetoappenduser.viewedusers.push(userid);
            await notetoappenduser.save();
        }

        const note = await Note.findById(req.params.id).populate('viewedusers');
        if (!note) {
            console.log('Note not found');
            return res.status(404).send('Note not found');
        }

        const user = await NoteUser.findById(note.user);

        if (!user) {
            console.log('User not found');
            return res.status(404).send('User not found');
        }

        const newNote = {
            _id: note._id,
            title: note.title,
            content: note.content,
            date: note.datetime,
            username: user.name,
            useremail: user.email,
            phone: user.phone,
            usersviewed: note.viewedusers,
        };

        res.json(newNote);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
});

// Create a new note
app.post('/note', authenticateToken, async (req, res) => {
    if (!req.body.title || !req.body.content || !req.body.user) {
        return res.status(400).send("Please enter the data");
    }
    const token1 = req.headers['authorization'];
    const userid = token.decode(token1).userId;
    try {
        const note = new Note({
            title: req.body.title,
            content: req.body.content,
            user: req.body.user,
            viewedusers: [userid]
        });

        // Save the note
        await note.save();
        res.json(note);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
});

// Delete a note
app.delete('/note/:id', authenticateToken, async (req, res) => {
    try {
        const note = await Note.findByIdAndDelete(req.params.id);
        if (!note) {
            console.log('Note not found');
            return res.status(404).send('Note not found');
        }
        res.json(note);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
});

// Update a note
app.put('/note/:id', authenticateToken, async (req, res) => {
    try {
        const note = await Note.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            content: req.body.content
        }, { new: true });

        if (!note) {
            console.log('Note not found');
            return res.status(404).send('Note not found');
        }

        res.json(note);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
});

// login user
app.post('/login', async (req, res) => {
    try {
        const user = await NoteUser.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);

        if (!validPassword) {
            return res.status(400).json({ msg: 'Invalid password' });
        }

        const key = "saikirNani@123"
        const tokens = token.sign(
            { userId: user._id, isAdmin: user.isAdmin },
            key,
            { expiresIn: '500h' }
        );

        res.status(200).json({ tokens, user });

    } catch (err) {
        console.error('Error in login controller:', err);
        res.status(500).send('Internal server error');
    }
});


app.listen(port1, () => {
    console.log('Server is running on port ' + port1);
});

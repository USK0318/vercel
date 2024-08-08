const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./connect');
const cors = require('cors');

// Load environment variables
const port1 = process.env.SERVER_PORT || 3000;

app.use(cors({
    origin: '*',
    credentials: true
  }));

// Connect to MongoDB
connectDB();

// Define User schema and model
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
});
const NoteUser = mongoose.model('NoteUser', userSchema);

const notesSchema = new mongoose.Schema({
    title: String,
    content: String,
    user: String,
    datetime: { type: Date, default: Date.now }
});
const Note = mongoose.model('Note', notesSchema);

app.get('/', (req, res) => {
    res.send('Hello World');
});
app.get('/users', async (req, res) => {
    const users = await NoteUser.find();
    res.json(users);
}
);

app.get('/note', async (req, res)=>{
     const note1 = await Note.find();
     res.json(note1)
}
);

app.get('/note/:id', async (req, res) => {
    try {
        // Fetch the note and populate the user field
        const note = await Note.findById(req.params.id).populate('user');
        
        if (!note) {
            console.log('Note not found');
            return res.status(404).send('Note not found');
        }

        // Prepare the response with the note and user details
        const newNote = {
            _id: note._id,
            title: note.title,
            content: note.content,
            date: note.datetime,
            username: note.user.name,
            useremail: note.user.email
        };

        res.json(newNote);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
});

app.post('/note', async (req, res) => {
    try {
        // Create a new note
        const note = new Note({
            title: req.body.title,
            content: req.body.content,
            user: req.body.user
        });

        // Save the note
        await note.save();
        res.json(note);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
}
);


app.listen(port1, () => {
    console.log('Server is running on port ' + port1);
});

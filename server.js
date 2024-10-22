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
    password:String,
    email: String,
    phone:Number
});
const NoteUser = mongoose.model('NoteUser', userSchema);

const notesSchema = new mongoose.Schema({
    title: String,
    content: String,
    user: String,
    datetime: { type: Date, default: Date.now }
});
const Note = mongoose.model('Note', notesSchema);

app.get('/' ,authenticateToken,(req, res) => {
    res.send('Hello World');
});

app.get('/users/:id',authenticateToken, async (req, res) => {
    try {
        const user = await NoteUser.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
    

app.get('/note', async (req, res)=>{
     const note1 = await Note.find();
     res.json(note1)
}
);

app.get('/note/:id',authenticateToken, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
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
            phone:user.phone
        };

        res.json(newNote);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal server error');
    }
});


app.post('/note',authenticateToken, async (req, res) => {
    // Check if any of the required fields are missing
    if (!req.body.title || !req.body.content || !req.body.user) {
        return res.status(400).send("Please enter the data"); // Send a 400 Bad Request status
    }
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
});


app.delete('/note/:id',authenticateToken, async (req, res) => {
    try {
        // Delete a note
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

app.put('/note/:id',authenticateToken, async (req, res) => {
    try {
        // Update a note
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
}
);

app.post('/login', async(req, res) => { 
        try {
          const user = await NoteUser.findOne({ email: req.body.email });
          if (!user) {
            return res.status(404).json({ msg: 'User not found' });
          }
      
          const validPassword = await bcrypt.compare(req.body.password, user.password);
      
          if (!validPassword) {
            return res.status(400).json({ msg: 'Invalid password' });
          }
      
          const key="saikirNani@123"
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

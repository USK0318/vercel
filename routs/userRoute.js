const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const auth = require('../models/token');

router.get("/",(req,res)=>{
    res.send("Hello User");
});

module.exports = router;
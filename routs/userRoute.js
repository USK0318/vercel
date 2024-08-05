const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const auth = require('../models/token');

router.get('/:id',userController.getUser);
router.post('/', userController.createUser);
router.post('/login', userController.loginUser);

module.exports = router;
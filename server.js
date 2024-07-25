const express = require('express');
const app = express();

const dotenv = require("dotenv").config();

const port1 = process.env.server_port;


app.get('/', (req, res) => {
    res.send('Hello World');
    }
);

app.listen(port1, () => {
    console.log('Server is running on port ' + port1);
    }
);
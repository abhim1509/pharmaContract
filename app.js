const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;

const registerCompany = require('./registerCompany');

app.use(cors());
app.use(express.urlencoded({extended:true}));
app.set('title', 'Pharma App');
app.get('/', (req, res)=> res.send("Hello world"));

app.post("")
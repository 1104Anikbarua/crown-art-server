const express = require('express');
const cors = require('cors');

const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;
const app = express();
app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
    res.send('server is running')
})

echo "# b7a12-summer-camp-server_side-1104Anikbarua" >> README.md
git init
git add README.md
git commit - m "first commit"
git branch - M main
git remote add origin https://github.com/programming-hero-web-course1/b7a12-summer-camp-server_side-1104Anikbarua.git
git push - u origin main

app.listen(port, () => {
    console.log(`server is running in port ${port}`)
})
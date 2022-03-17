const express = require('express')
const cors = require('cors')
const route = require('./routes')
// const bodyParser = require('body-parser');

const https = require('https')
const fs = require('fs')
const path = require("path")


const app = express()
app.use(express.urlencoded({extended: true})); 
app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

app.use(cors())
app.use('',route)
app.use(express.json());
// const port = process.env.PORT;
const port = process.env.PORT || 5555;

console.log(process.env.PORT, process.env.HOST);

app.listen(port, () => console.log(`Listening on port ${port}`))

// const sslServer = https.createServer(
//     {
//         key: fs.readFileSync(path.join(__dirname,'cert','key.pem')),
//         cert: fs.readFileSync(path.join(__dirname,'cert','cert.pem'))
//     }
//     , app)

// sslServer.listen(5555, () => console.log(`Listening on port 5555`))
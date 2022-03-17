const express = require('express')
const router = express.Router()
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const mysql = require('./connection')



router.get('/cities',(req,res)=>{
    mysql.query('SELECT * from cities', (err,rows)=>{
        if (!err) res.send(rows)
        else console.log(err)
    })
})

router.post('/add-city',(req,res) => {
    const lieu = req.body
    mysql.query(`SELECT * from cities where city=? and country=?`,[lieu.city,lieu.country],(err,rows) => {
        console.log('exist');
        if (rows.length === 0){
            mysql.query('INSERT INTO cities SET ?', lieu, (err, rows) => {
                if (err) console.log(err)
            })
        }
    })
})

// router.get('/cities',(req,res)=>{
//     mysql.query('SELECT * from villes', (err,rows)=>{
//         if (!err) res.send(rows)
//         else console.log(err)
//     })
// })



router.get('/countries',(req,res) => {
    mysql.query('SELECT * from countries', (err,rows) => {
        if (!err) {
            res.send(rows)
            console.log(rows);
        }
        else console.log(err);
    })
})


module.exports = router










// router.post('/modify', (req,res) => {
//     let item = {
//         country :req.body.country,
//         id      :req.body.id
//     }
//     connection.query(`UPDATE cities SET id_country = ${req.body.id} where country = '${req.body.country}'`)
//     res.send({'msg':'un item modifié'})
// })



// router.post('/register', verifyToken, (req,res)=>{
//     jwt.verify(req.token,'SECRETKEY', (err,decode)=>{
//         if (err) res.send({status:'403'})//res.sendStatus(403)
//         else {
//             let user = req.body
//             bcrypt.hash(user.password, 10, function(err, hash) {
//                 user.password = hash
//                 mysql.query('SELECT * FROM user WHERE email = ?', [user.email], 
//                 (err,result)=> {
//                     if (result.length){
//                         console.log(result)
//                         res.send({
//                             status:'409',
//                             msg: 'This username is already in use!'
//                         })
//                     }
//                     else{
//                         mysql.query('INSERT INTO user SET ?', user, (err, rows) => {
//                             if (!err) {
//                                 res.send({response:`User with the email ${user.email} has been added.`})
//                             } else {
//                                 console.log(err)
//                             }
//                         })
//                     }
//                 })
//             });
//             decode
//         }
//     })
// })

// function verifyToken(req,res,next){
//     const bearerHeader = req.headers.authorization
//     if (typeof bearerHeader !== "undefined"){
//         const bearerToken = bearerHeader.split(' ')[1]
//         req.token = bearerToken
//         next()
//     }
//     else {
//         return res.sendStatus(403)
//     }
// }

// router.post('/login', (req,res)=>{
//     const email = req.body.email;
//     const password = req.body.password
//     let hash

//     if (email && password) {
//         mysql.query('SELECT * FROM user WHERE email = ?', [email], 
//         (error, result, fields)=> {
//             if (result.length>0){
//                 console.log(result)
//                 hash = result[0]['password']
//                 bcrypt.compare(password, hash, function(err, isMatch) {
//                     if (err) {
//                         throw err
//                     } 
//                     else if (!isMatch) {
//                         res.send({message:"password incorrect"})
//                         console.log("Password doesn't match!")
//                     } 
//                     else {
//                         const token = jwt.sign({
//                             email:result[0]['email'],
//                             role: result[0]['role']
//                         },
//                         'SECRETKEY', {expiresIn:'7d'}
//                         )
//                         res.send({token})
//                         console.log(token)
//                         mysql.query(
//                             `UPDATE user SET last_login = now() WHERE id = '${result[0].id}'`
//                             );
//                     }
//                 })
//             }
//             else{
//                 console.log("User is invalid")
//                 res.send('Please enter Username and Password!');
//                 res.end();
//             }
//         })
//     }
// })

// router.get('/users', (req, res) => {
//     mysql.query('SELECT * from user', (err, rows) => {
//         if (!err) {
//             res.send(rows)
//         } else {
//             console.log(err)
//         }
//     })
// })
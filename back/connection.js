const mysql = require('mysql2')
const pool = mysql.createPool({
    host            : 'localhost',
    user            : 'osm',
    password        : 'osm',
    database        : 'location'
})

// const pool = mysql.createPool({
//     host            : 'eu-cdbr-west-02.cleardb.net',
//     user            : 'bef3683ac1a445',
//     password        : '4b20b87e',
//     database        : 'heroku_e380f9a3434d1e2',
// })

pool.getConnection(function(err) {
    if (err) throw err;
    console.log("Database Connected!");
  });

  module.exports = pool

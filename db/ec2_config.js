//creating db connection 
var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'verdantu',
    port:'3306',
    database:'Verdant'
});

//exported- to be used outside this file
module.exports = connection;

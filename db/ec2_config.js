//creating db connection 
var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Verdantu!30',
    port:'3306',
    database:'Verdantu',
    multipleStatements: true
});

//exported- to be used outside this file
module.exports = connection;

//creating db connection 
var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'nish',
    password: 'login123',
    port:'3306',
    database:'verdant',
    multipleStatements: true
});

//exported- to be used outside this file
module.exports = connection;

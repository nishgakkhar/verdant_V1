var con = require('./db/local_config');
var app = require('./server/port');
const bodyParser = require('body-parser')


//API to return list of Fruits with carbon emission and emission ID associated to it
app.get("/api/food_Carbon_Emission_fruit", function (req, res) {
var sql = `select EmissionsId, Foods, Emissions from FoodEmissions where CategoryId like 'Fruits';`;
    con.query(sql,  function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(JSON.stringify(recordset));
        });
});

//API to return list of all food items with carbon emission and emission ID associated to it
app.get("/api/food_Carbon_Emission", function (req, res) {
var sql = `select EmissionsId, Foods, Emissions from FoodEmissions;`;
    con.query(sql,  function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(JSON.stringify(recordset));
        });
});

//API to return list of Vegetables carbon emission and emission ID associated to it

app.get("/api/food_Carbon_Emission_veggie", function (req, res) {
var sql = `select EmissionsId, Foods, Emissions from FoodEmissions where CategoryId like 'Vegetables';`;
    con.query(sql,  function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(JSON.stringify(recordset));
        });
});

//API to return list of meat with carbon emission and emission ID associated to it

app.get("/api/food_Carbon_Emission_meat", function (req, res) {
var sql = `select EmissionsId, Foods, Emissions from FoodEmissions where CategoryId like 'Meat';`;
    con.query(sql,  function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(JSON.stringify(recordset));
        });
});

//API to return list of other items with carbon emission and emission ID associated to it

app.get("/api/food_Carbon_Emission_other", function (req, res) {
var sql = `select EmissionsId, Foods, Emissions from FoodEmissions where CategoryId like 'Other';`;
    con.query(sql,  function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(JSON.stringify(recordset));
        });
});

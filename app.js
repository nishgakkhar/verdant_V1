var con = require('./db/ec2_config');
var app = require('./server/port');

const bodyParser = require('body-parser')


//API to return list of Fruits with carbon emission and emission ID associated to it
app.get("/api/food_Carbon_Emission_fruit", function (req, res) {
var sql = `select EmissionsId, Foods, Emissions from FoodEmissions where CategoryId like '2';`;

    con.query(sql,  function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(JSON.stringify(recordset));
        });
});

//API to return list of all food items with carbon emission and emission ID associated to it
app.get("/api/food_Carbon_Emission", function (req, res) {
var sql = `select EmissionsId, Foods, Emissions from FoodEmissions ;`;
    con.query(sql,  function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(JSON.stringify(recordset));
        });
});

//API to return list of Vegetables carbon emission and emission ID associated to it

app.get("/api/food_Carbon_Emission_veggie", function (req, res) {
var sql = `select EmissionsId, Foods, Emissions from FoodEmissions where CategoryId like '1';`;
    con.query(sql,  function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(JSON.stringify(recordset));
        });
});

//API to return list of meat with carbon emission and emission ID associated to it

app.get("/api/food_Carbon_Emission_meat", function (req, res) {
var sql = `select EmissionsId, Foods, Emissions from FoodEmissions where CategoryId like '3';`;
    con.query(sql,  function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(JSON.stringify(recordset));
        });
});

//API to return list of other items with carbon emission and emission ID associated to it

app.get("/api/food_Carbon_Emission_other", function (req, res) {
var sql = `select EmissionsId, Foods, Emissions from FoodEmissions where CategoryId like '4';`;

    con.query(sql,  function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            res.send(JSON.stringify(recordset));
        });
});
//API to add the list of food items for which carbon emission and food category will be added
app.post("/api/addEmission", function(req, res) {
	console.log("Request structure:", req.body);
	var insert_sql_data = [];
	for (var dataVal = 0; dataVal < req.body.length; dataVal++) {
		     var input_data = [];
		     input_data.push(req.body[dataVal].UserId, req.body[dataVal].Foods, req.body[dataVal].emission, req.body[dataVal].categoryName, req.body[dataVal].date_of_entry);
		     insert_sql_data.push(input_data);
		   }
	 var sql = "INSERT INTO user_food_consumption (UserId, Foods, emission, categoryName, date_of_entry) VALUES ?";
	 con.query(sql, [insert_sql_data], function(err, result) {
	 if (err) throw err;
	 console.log("Number of records inserted: " + result.affectedRows);
	 });
});

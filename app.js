var con = require('./db/ec2_config');
var app = require('./server/port');
var _ = require('underscore');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(bodyParser.raw());


//API to get food emission for all the raw food items - Data table used is food_information
app.get("/api/food_Carbon_Emission", function(req, res) {
    var sql = `select EmissionsId, Foods, Emissions from food_information;`;
    sqlQueryRun(sql, res);
});

//API to return list of food items as per the category given and give EmissionID, name and emission of the food
app.get("/api/food_Carbon_Emission_category/:category", function(req, res) {
    var categoryParam = req.params.category;
    var sql = `select EmissionsId, Foods, Emissions from food_information where CategoryId like (select CategoryId from FoodType where CategoryName = ?);`;
    con.query(sql, categoryParam, function(err, recordset) {
        if (err) console.log(err)
            // send records as a response
        console.log('Console in get API for different CategoryName' + JSON.stringify(recordset));
        res.send(JSON.stringify(recordset));
    });
});

//API to return information of nutrition for last 7 days 
app.get("/api/get_nutrition_food", function(req, res) {
    var sql = "select DAYNAME(date_of_entry) AS 'Date', round((sum(Fat)),2) AS 'Fat', round((sum(Protein)),2) AS 'Protein', round((sum(Carbohydrate)),2) AS 'Carbohydrate' FROM user_food_consumption WHERE date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY date_of_entry ORDER BY DAYOFWEEK(date_of_entry); select DAYNAME(date_of_entry) AS 'Date', round((sum(Fat)),2) AS 'Fat', round((sum(Protein)),2) AS 'Protein', round((sum(Carbohydrate)),2) AS 'Carbohydrate' FROM user_recipe_consumption WHERE date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY date_of_entry ORDER BY DAYOFWEEK(date_of_entry); "
    con.query(sql, function(err, recordset) {
        if (err) console.log(err)
        console.log("Nutrition Info******\n" + JSON.stringify(recordset));
        var flattenData = _.flatten(recordset);
        var fat = 0,
            carbs = 0,
            protein = 0,
            total = 0,
            bargraph = [];
        //To match days where emission is available and add all emission
        for (var i = 0; i < flattenData.length; i++) {
            fat += flattenData[i].Fat;
            protein += flattenData[i].Protein;
            carbs += flattenData[i].Carbohydrate;
        }
        total = fat + protein + carbs;
        var fatPer = Math.round(((fat / total) * 100), 2);
        var proteinPer = Math.round(((protein / total) * 100), 2);
        var carbsPer = Math.round(((carbs / total) * 100), 2);
        bargraph.push({
            "Fat": fatPer,
            "Protein": proteinPer,
            "Carbohydrate": carbsPer
        });
        console.log("This is FAT\n" + fatPer);
        console.log("This is Carbohydrate\n" + carbsPer);
        console.log("This is Protein\n" + proteinPer);

        res.send(JSON.stringify(bargraph));
    });
});

//rest api to update raw food record into mysql database
app.put('/api/update_raw_food', function(req, res) {
    var sql = "UPDATE user_food_consumption SET quantity=? ,emission = ? where ObjectID = ?;";
    con.query(sql, [req.body[0].quantity, req.body[0].emission, req.body[0].ObjectID], function(error, results, fields) {
        if (error) throw error;
        res.send("Record Updated");
    });
});

//rest api to update recipe record into mysql database
app.put('/api/update_recipe_food', function(req, res) {
    var sqlu = "(select VegEmissionsPerServe,FruitEmissionsPerServe, MeatEmissionsPerServe, OtherEmissionsPerServe from recipe_information where RecipeName = ?)";
    con.query(sqlu, req.body[0].RecipeName, function(error, results, fields) {
        var sql = "UPDATE user_recipe_consumption SET serves=?, totalEmission = ?, vegEmission = ? , meatEmission = ?,otherEmission = ?,fruitEmission = ? where ObjectID = ?;"
        console.log('resultInfo' + JSON.stringify(results));
        var serves = req.body[0].serves;
        var vegEmission = results[0].VegEmissionsPerServe ? results[0].VegEmissionsPerServe * serves : 0;
        var fruitEmission = results[0].FruitEmissionsPerServe ? results[0].FruitEmissionsPerServe * serves : 0;
        var meatEmission = results[0].MeatEmissionsPerServe ? results[0].MeatEmissionsPerServe * serves : 0;
        var otherEmission = results[0].OtherEmissionsPerServe ? results[0].OtherEmissionsPerServe * serves : 0;
        var totalEmission = req.body[0].totalEmission * serves;
        var obID = req.body[0].ObjectID;
        if (error) throw error;
        con.query(sql, [serves, totalEmission, vegEmission, meatEmission, otherEmission, fruitEmission, obID], function(error, record, fields) {
            if (error) throw error;
            res.send("Record Updated");
        });
    });
});

//delete raw food record
app.delete('/api/delete_raw_food', function(req, res) {
    var sql = "delete from user_food_consumption where ObjectID = ?;";
    con.query(sql, [req.body[0].ObjectID], function(error, results, fields) {
        if (error) throw error;
        res.send("Record Deleted");
    });
});

//delete recipe food
app.delete('/api/delete_recipe_food', function(req, res) {
    var sql = "delete from user_recipe_consumption where ObjectID = ?;";
    con.query(sql, [req.body[0].ObjectID], function(error, results, fields) {
        if (error) throw error;
        res.send("Record Deleted");
    });
});

// API to get emission for the day on home screen
app.get("/api/Landing_page", function(req, res) {
    var sql = `select round(sum(emission),2) as "rawEmission" from user_food_consumption where date_of_entry = curdate();select round(sum(totalEmission),2) as "recipeEmission" from user_recipe_consumption where date_of_entry = curdate();`;
    con.query(sql, function(err, recordset) {
        if (err) console.log(err)
        var flatData = _.flatten(recordset);
        var rawEmission = flatData[0].rawEmission != null ? (flatData[0].rawEmission) : 0;
        var recipeEmission = flatData[1].recipeEmission != null ? (flatData[1].recipeEmission) : 0;
        var emission = rawEmission + recipeEmission;
        res.send(JSON.stringify([{
            "emission": emission
        }]));
    });
});

// API to get  emission from recipe dataset
app.get("/api/Recipe_Carbon_Emission", function(req, res) {
    var sql = `select RecipeName, EmissionsPerServe from recipe_information;`;
    sqlQueryRun(sql, res);
});

// API to get  list of added food by the user in raw food item list dataset
app.get("/api/view_food_added", function(req, res) {
    var sql = `select ObjectID, emission, quantity, deviceID,  (select Foods from food_information where EmissionsId in (select EmissionsId from user_food_consumption)) as foods from user_food_consumption;`;
    con.query(sql, function(err, recordset) {
        if (err) console.log(err)
        res.send(JSON.stringify(recordset));
    });
});

// API to get  list of added recipe by the user in recipe item list dataset
app.get("/api/view_recipe_added", function(req, res) {
    var sql = `select ObjectID, totalEmission, serves, deviceID,  (select RecipeName from recipe_information where RecipeID in (select recipeID from user_recipe_consumption)) as recipe from user_recipe_consumption;`;
    sqlQueryRun(sql, res);
});


// API to get weekly distribution of emission on each day
app.get("/api/weekly_report", function(req, res) {
    var sql = "select DAYNAME(date_of_entry) AS 'Date', round((sum(emission)),2) AS 'emission' FROM user_food_consumption WHERE date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY date_of_entry ORDER BY DAYOFWEEK(date_of_entry); select DAYNAME(date_of_entry) AS 'Date', round((sum(totalEmission)),2) AS 'emission' FROM user_recipe_consumption WHERE date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY date_of_entry ORDER BY DAYOFWEEK(date_of_entry); "
    con.query(sql, function(err, result) {
        if (err) {
            res.send("No data found");
        } else {
            // _.flatten - To simplify the array
            var flattenData = _.flatten(result);
            console.log('Return Call response\n' + JSON.stringify(flattenData));
            var sunEm = 0,
                monEm = 0,
                tueEm = 0,
                wedEm = 0,
                thurEm = 0,
                friEm = 0,
                satEm = 0,
                bargraph = [];
            //To match days where emission is available and add all emission
            for (var i = 0; i < flattenData.length; i++) {
                if (flattenData[i].Date == "Sunday") {
                    sunEm = sunEm + flattenData[i].emission;
                }
                if (flattenData[i].Date == "Monday") {
                    monEm = monEm + flattenData[i].emission;
                }
                if (flattenData[i].Date == "Tuesday") {
                    tueEm = tueEm + flattenData[i].emission;
                }
                if (flattenData[i].Date == "Wednesday") {
                    wedEm = wedEm + flattenData[i].emission;
                }
                if (flattenData[i].Date == "Thursday") {
                    thurEm = thurEm + flattenData[i].emission;
                }
                if (flattenData[i].Date == "Friday") {
                    friEm = friEm + flattenData[i].emission;
                }
                if (flattenData[i].Date == "Saturday") {
                    satEm = satEm + flattenData[i].emission;
                }
            }

            // To check if the emission is greater than zero then only push the data to an array to display in graph
            if (sunEm > 0) {
                bargraph.push({
                    "Date": "Sunday",
                    "emission": sunEm
                })
            }
            if (tueEm > 0) {
                bargraph.push({
                    "Date": "Tuesday",
                    "emission": tueEm
                })
            }
            if (wedEm > 0) {
                bargraph.push({
                    "Date": "Wednesday",
                    "emission": wedEm
                })
            }
            if (thurEm > 0) {
                bargraph.push({
                    "Date": "Thursday",
                    "emission": thurEm
                })
            }
            if (friEm > 0) {
                bargraph.push({
                    "Date": "Friday",
                    "emission": friEm
                })
            }
            if (monEm > 0) {
                bargraph.push({
                    "Date": "Monday",
                    "emission": monEm
                })
            }
            if (satEm > 0) {
                bargraph.push({
                    "Date": "Saturday",
                    "emission": satEm
                })
            }
            if (bargraph.length <= 0) {
                res.send("No data found");
            } else res.send(JSON.stringify(bargraph));
        }
    });
});

//API to get carbon emission distribution categorywise
app.get("/api/weekly_category_wise", function(req, res) {
    var sql = "SELECT t1.categoryName, ROUND(SUM(emission) , 2) AS 'emission' FROM user_food_consumption t2, FoodType t1 WHERE t2.date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() AND t1.categoryID = t2.categoryID GROUP BY t2.categoryID; select Round(sum(vegEmission),2) as Vegetables, Round(sum(fruitEmission)) as Fruits, Round(sum(meatEmission),2) as Meat, Round(sum(otheremission),2) as Other from user_recipe_consumption WHERE date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY (vegEmission and fruitEmission and meatEmission and otherEmission);";
    con.query(sql, function(err, result) {
        if (err) {
            console.log("No data found");
        } else {
            var categoryEmission = result[0];
            var categoryDis = result[1];
            // compute total emission from all category when data is present in both tables i.e. for raw food and for recipe
            if (categoryEmission.length > 0 && categoryDis.length > 0) {
                var vegEm = 0,
                    otherEm = 0,
                    meatEm = 0,
                    fruitEm = 0;
                totalEm = 0;
                responseEm = [];
                categoryName = "";
                for (var i = 0; i < categoryEmission.length; i++) {
                    if (categoryEmission[i].categoryName == "Vegetables") {
                        vegEm = categoryEmission[i].emission;
                    }
                    if (categoryEmission[i].categoryName == "Other") {
                        otherEm = categoryEmission[i].emission;
                    }
                    if (categoryEmission[i].categoryName == "Fruits") {
                        fruitEm = categoryEmission[i].emission;
                    }
                    if (categoryEmission[i].categoryName == "Meat") {
                        meatEm = categoryEmission[i].emission;
                    }
                }
                for (var i = 0; i < categoryDis.length; i++) {
                    if (categoryDis[i].Vegetables >= 0) {
                        totalEm = (categoryDis[i].Vegetables + vegEm);
                        categoryName = "Vegetables";
                        responseEm.push({
                            "categoryName": categoryName,
                            "emission": totalEm
                        });
                    }
                    if (categoryDis[i].Other >= 0) {
                        totalEm = (categoryDis[i].Other + otherEm);
                        categoryName = "Other";
                        responseEm.push({
                            "categoryName": categoryName,
                            "emission": totalEm
                        });
                    }
                    if (categoryDis[i].Fruits >= 0) {
                        totalEm = (categoryDis[i].Fruits + fruitEm);
                        categoryName = "Fruits";
                        responseEm.push({
                            "categoryName": categoryName,
                            "emission": totalEm
                        });
                    }
                    if (categoryDis[i].Meat >= 0) {
                        console.log("hbjhgh");
                        totalEm = (categoryDis[i].Meat + meatEm);
                        categoryName = "Meat";
                        responseEm.push({
                            "categoryName": categoryName,
                            "emission": totalEm
                        });
                    }
                    console.log('Return Call response\n' + JSON.stringify(responseEm));
                    res.send(JSON.stringify(responseEm))
                }
            }
            // compute total emission from all category when data is present only for recipe
            else if (categoryDis.length > 0) {
                var onlyResp = "select Round(sum(vegEmission),2) as Vegetables, Round(sum(fruitEmission)) as Fruits, Round(sum(meatEmission),2) as Meat, Round(sum(otheremission),2) as Other from user_recipe_consumption WHERE date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY (vegEmission and fruitEmission and meatEmission and otherEmission);";
                con.query(onlyResp, function(err, result) {

                    var responseEm = [];
                    if (result[0].Vegetables >= 0) {
                        categoryName = "Vegetables";
                        responseEm.push({
                            "categoryName": categoryName,
                            "emission": result[0].Vegetables
                        });
                    }
                    if (result[0].Other >= 0) {
                        categoryName = "Other";
                        responseEm.push({
                            "categoryName": categoryName,
                            "emission": result[0].Other
                        });
                    }
                    if (result[0].Fruits >= 0) {
                        categoryName = "Fruits";
                        responseEm.push({
                            "categoryName": categoryName,
                            "emission": result[0].Fruits
                        });
                    }
                    if (result[0].Meat >= 0) {
                        categoryName = "Meat";
                        responseEm.push({
                            "categoryName": categoryName,
                            "emission": result[0].Meat
                        });
                    }
                    res.send(JSON.stringify(responseEm))
                });
            }
            // compute total emission from all category when data is present only for rw food items
            else if (categoryEmission.length > 0) {
                var onlyfood = "SELECT t1.categoryName, ROUND(SUM(emission) , 2) AS 'emission' FROM user_food_consumption t2, FoodType t1 WHERE t2.date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() AND t1.categoryID = t2.categoryID GROUP BY t2.categoryID";
                con.query(onlyfood, function(err, result) {
                    res.send(JSON.stringify(result));
                });
            }
            // send this response when no data is available
            else {
                res.send("No data found");
            }
        }
    });
});

//API to add the list of food items. It will add carbon emission and food category entered by user to database
app.post("/api/addEmission", function(req, res) {
    for (var dataVal = 0; dataVal < req.body.length; dataVal++) {
        var selectID = req.body[dataVal].categoryName;
        var foodName = req.body[dataVal].foods;
        var newDate = req.body[dataVal].date_of_entry;
        var date = new Date(newDate);
        console.log("This is date\n" + date);
        const dd = date.getDate();
        const mm = date.getMonth() + 1; // month start at 0, we have to add 1.
        const yyyy = date.getUTCFullYear();
        const now = `${yyyy}-${mm}-${dd}`;
        var sql = "INSERT INTO user_food_consumption (Carbohydrate, deviceID, EmissionsId, emission, categoryID, quantity, Protein, date_of_entry, Fat) VALUES ((select Carbohydrate from food_information where Foods = ? ), '" + req.body[dataVal].deviceID + "', (select EmissionsId from food_information where Foods = ? ) , '" + req.body[dataVal].emission + "', ( select CategoryId from FoodType where CategoryName = ? ),'" + req.body[dataVal].quantity + "',(select Protein from food_information where Foods = ? ),'" + now + "', (select Fat from food_information where Foods = ? ))";
        con.query(sql, [foodName, foodName, selectID, foodName, foodName], function(err, result) {
            if (err) throw err;
            console.log("Food added Successfully");
            res.send(req.body);
        });
    }
});

//API to add the list of recipe items. It will add carbon emission and food category entered by user to database
app.post("/api/add_recipe_emission", function(req, res) {
    var newDate = req.body[0].date_of_entry;
    var date = new Date(newDate);
    console.log("This is date\n" + date);
    const dd = date.getDate();
    const mm = date.getMonth() + 1; // month start at 0, we have to add 1.
    const yyyy = date.getUTCFullYear();
    const now = `${yyyy}-${mm}-${dd}`;
    var RecipeName = req.body[0].RecipeName;
    var serves = req.body[0].serves;
    var totEmission = req.body[0].totalEmission * serves;
    var meatEmission = req.body[0].totalEmission * serves
    var sql = "INSERT INTO user_recipe_consumption (Carbohydrate, Protein , Fat, meatEmission,otherEmission,deviceID, recipeID ,totalEmission, vegEmission ,date_of_entry, fruitEmission,serves) VALUES (( select RecipeCarbsPerServe from recipe_information where RecipeName = ?) * '" + req.body[0].serves + "', ( select RecipeProteinPerServe from recipe_information where RecipeName = ?) * '" + req.body[0].serves + "', ( select RecipeFatPerServe from recipe_information where RecipeName = ?) * '" + req.body[0].serves + "', ( select MeatEmissionsPerServe from recipe_information where RecipeName = ?) * '" + req.body[0].serves + "' ,( select OtherEmissionsPerServe from recipe_information where RecipeName = ?) * '" + req.body[0].serves + "' ,'" + req.body[0].deviceID + "', ( select RecipeID from recipe_information where RecipeName = ?) ,'" + totEmission + "', ( select VegEmissionsPerServe from recipe_information where RecipeName = ? ) * '" + req.body[0].serves + "' , '" + now + "', ( select FruitEmissionsPerServe from recipe_information where RecipeName = ?) * '" + req.body[0].serves + "' , '" + req.body[0].serves + "' )";
    con.query(sql, [RecipeName, RecipeName, RecipeName, RecipeName, RecipeName, RecipeName, RecipeName, RecipeName], function(err, result) {
        if (err) throw err;
        console.log("Recipe added Successfully");
        res.send(req.body);
    });
});


function sqlQueryRun(sql, res) {
    con.query(sql, function(err, recordset) {
        if (err) console.log(err)
        res.send(JSON.stringify(recordset));
    });
}
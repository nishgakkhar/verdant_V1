var con = require('./db/local_config');
var app = require('./server/port');
var async = require("async");
var _ = require('underscore');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(bodyParser.raw());


//API to get food emission for all the raw food items - Data table used is food_information
app.get("/api/food_Carbon_Emission", function(req, res) {
    var sql = `select * from food_information;`;
    sqlQueryRun(sql, res);
});

app.delete('/api/delete_recipe_food/:id', function(req, res) {
    if (req && req.params && req.params.id) {
        var idParams = req.params.id;
        var sql = "delete from user_recipe_consumption where ObjectID = ?;";
        con.query(sql, idParams, function(err, results, fields) {
            if (err) res.send(JSON.stringify("No data found"));
            res.send(JSON.stringify("Record Deleted"));
        });
    } else {
        res.send(JSON.stringify("No request body defined"));
    }
});

app.delete('/api/delete_raw_food/:id', function(req, res) {
    if (req && req.params && req.params.id) {
        var idParams = req.params.id;
        var sql = "delete from user_food_consumption where ObjectID = ?;";
        con.query(sql, idParams, function(err, results, fields) {
            if (err) res.send(JSON.stringify("No data found"));
            res.send(JSON.stringify("Record Deleted"));
        });
    } else {
        res.send(JSON.stringify("No request body defined"));
    }
});

//API to return list of food items as per the category given and give EmissionID, name and emission of the food
app.get("/api/food_Carbon_Emission_category/:category", function(req, res) {
    if (req && req.params && req.params.category) {
        var categoryParam = req.params.category;
        var sql = `select EmissionsId, Foods, Emissions from food_information where CategoryId like (select CategoryId from FoodType where CategoryName = ?);`;
        con.query(sql, categoryParam, function(err, recordset) {
            if (err) res.send(JSON.stringify("No data found"));
            // send records as a response
            console.log('Console in get API for different CategoryName' + JSON.stringify(recordset));
            res.send(JSON.stringify(recordset));
        });
    } else {
        res.send(JSON.stringify("No request body defined"));
    }
});

//API to return information of nutrition for last 7 days 
app.get("/api/get_nutrition_food/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        var sql = "select DAYNAME(date_of_entry) AS 'Date', round((sum(Fat)),2) AS 'Fat', round((sum(Protein)),2) AS 'Protein', round((sum(Carbohydrate)),2) AS 'Carbohydrate' FROM user_food_consumption WHERE deviceID = ? AND date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY date_of_entry ORDER BY DAYOFWEEK(date_of_entry); select DAYNAME(date_of_entry) AS 'Date', round((sum(Fat)),2) AS 'Fat', round((sum(Protein)),2) AS 'Protein', round((sum(Carbohydrate)),2) AS 'Carbohydrate' FROM user_recipe_consumption WHERE date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY date_of_entry ORDER BY DAYOFWEEK(date_of_entry); "
        con.query(sql, idDevice, function(err, recordset) {
            if (err) res.send(JSON.stringify("No data found"));
            console.log("Nutrition Info******\n" + JSON.stringify(recordset));
            var flattenData = _.flatten(recordset);
            var fat = 0,
                carbs = 0,
                protein = 0,
                total = 0,
                bargraph = [];
            //To match days where emission is available and add all emission
            if (flattenData.length) {
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
            } else res.send(JSON.stringify("No request body defined"));

        });
    } else res.send(JSON.stringify("Missing Device ID"));
});

//rest api to update raw food record into mysql database
app.put('/api/update_raw_food', function(req, res) {
    if (req && req.body && req.body.length && req.body[0].Foods && req.body[0].ObjectID) {
        var sqlu = "(select Fat, Protein, Carbohydrate from food_information where Foods = ?)";
        con.query(sqlu, req.body[0].Foods, function(error, results) {
            if (results && results.length) {
                var quantity = req.body[0].quantity;
                var emission = req.body[0].emission;
                var fat = results[0].Fat * quantity;
                var carbs = results[0].Carbohydrate * quantity;
                var protein = results[0].Protein * quantity;
                var obID = req.body[0].ObjectID;
                if (error) res.send(JSON.stringify("No data found"));
                console.log("Info of raw food items" + JSON.stringify(results));
                var sql = "UPDATE user_food_consumption SET quantity=? ,emission=? , Fat=?, Protein=? , Carbohydrate=?  where ObjectID = ?;";
                con.query(sql, [quantity, emission, fat, protein, carbs, obID], function(error, results, fields) {
                    if (error) res.send(JSON.stringify("No data found"));
                    res.send(JSON.stringify("Record Updated"));
                });
            } else {
                res.send(JSON.stringify("No record found"));
            }

        });
    } else res.send(JSON.stringify("Missing Body structure"));

});

//rest api to update recipe record into mysql database
app.put('/api/update_recipe_food', function(req, res) {
    if (req && req.body && req.body.length && req.body[0].RecipeName && req.body[0].ObjectID && req.body[0].totalEmission) {
        var sqlu = "(select RecipeFatPerServe, RecipeProteinPerServe, RecipeCarbsPerServe,  VegEmissionsPerServe,FruitEmissionsPerServe, MeatEmissionsPerServe, OtherEmissionsPerServe from recipe_information where RecipeName = ?)";
        con.query(sqlu, req.body[0].RecipeName, function(error, results) {
            var sql = "UPDATE user_recipe_consumption SET Protein= ?, Carbohydrate = ?, Fat = ?, serves=?, totalEmission = ?, vegEmission = ? , meatEmission = ?,otherEmission = ?,fruitEmission = ? where ObjectID = ?;"
            if (results && results.length) {
                var serves = req.body[0].serves;
                var vegEmission = results[0].VegEmissionsPerServe ? results[0].VegEmissionsPerServe * serves : 0;
                var fruitEmission = results[0].FruitEmissionsPerServe ? results[0].FruitEmissionsPerServe * serves : 0;
                var meatEmission = results[0].MeatEmissionsPerServe ? results[0].MeatEmissionsPerServe * serves : 0;
                var otherEmission = results[0].OtherEmissionsPerServe ? results[0].OtherEmissionsPerServe * serves : 0;
                var fat = results[0].RecipeFatPerServe ? results[0].RecipeFatPerServe * serves : 0;
                var protein = results[0].RecipeProteinPerServe ? results[0].RecipeProteinPerServe * serves : 0;
                var carbs = results[0].RecipeCarbsPerServe ? results[0].RecipeCarbsPerServe * serves : 0;
                var totalEmission = req.body[0].totalEmission * serves;
                var obID = req.body[0].ObjectID;
                if (error) res.send(JSON.stringify("No data found"));
                console.log('resultInfo' + JSON.stringify(results));
                con.query(sql, [fat, protein, carbs, serves, totalEmission, vegEmission, meatEmission, otherEmission, fruitEmission, obID], function(error, record, fields) {
                    if (error) res.send(JSON.stringify("No data found"));
                    res.send(JSON.stringify("Record Updated"));
                });
            } else {
                res.send(JSON.stringify("No record found"));
            }
        });
    } else {
        res.send(JSON.stringify("Missing Body structure"));
    }

});

// API to get emission for the day on home screen
app.get("/api/Landing_page/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        var sql = `select round(sum(emission),2) as "rawEmission" from user_food_consumption where deviceID = ? AND date_of_entry = curdate();select round(sum(totalEmission),2) as "recipeEmission" from user_recipe_consumption where deviceID = ? AND date_of_entry = curdate();`;
        con.query(sql, [idDevice, idDevice], function(err, recordset) {
            if (err) res.send(JSON.stringify("No data found"));
            if (recordset && recordset.length) {
                var flatData = _.flatten(recordset);
                var rawEmission = flatData[0].rawEmission != null ? (flatData[0].rawEmission) : 0;
                var recipeEmission = flatData[1].recipeEmission != null ? (flatData[1].recipeEmission) : 0;
                var emission = (rawEmission + recipeEmission).toFixed(2);
                res.send(JSON.stringify([{
                    "emission": emission
                }]));
            } else res.send(JSON.stringify("Missing Body structure"));
        });
    } else res.send(JSON.stringify("Missing Device ID"));

});

// API to get  emission from recipe dataset
app.get("/api/Recipe_Carbon_Emission", function(req, res) {
    var sql = `select * from recipe_information;`;
    sqlQueryRun(sql, res);
});

// API to get  list of added food by the user in raw food item list dataset
app.get("/api/view_food_added/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        var sql = `select Foods,EmissionsId  from food_information`;
        con.query(sql, function(err, recordset) {
            if (err) res.send(JSON.stringify("No data found"));
            var sql = 'select * from user_food_consumption where deviceID = ?';
            con.query(sql, idDevice, function(err, result) {
                if (err) res.send(JSON.stringify("No data found"));
                if (result && result.length) {
                    for (var i = 0; i < result.length; i++) {
                        for (var p = 0; p < recordset.length; p++) {
                            if (recordset[p].EmissionsId == result[i].EmissionsId) {
                                result[i].Foods = recordset[p].Foods;
                            }
                        }
                    }
                    res.send(JSON.stringify(result));
                } else res.send(JSON.stringify("Missing Body structure"));
            });
        });
    } else res.send(JSON.stringify("Missing Device ID"));
});

// API to get  list of added recipe by the user in recipe item list dataset
app.get("/api/view_recipe_added/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        var sql = `select RecipeName,RecipeID  from recipe_information`;
        con.query(sql, function(err, recordset) {
            if (err) res.send(JSON.stringify("No data found"));
            var sql = 'select  * from user_recipe_consumption where deviceID = ?';
            con.query(sql, idDevice, function(err, result) {
                if (err) res.send(JSON.stringify("No data found"));
                if (result && result.length) {
                    for (var i = 0; i < result.length; i++) {
                        for (var p = 0; p < recordset.length; p++) {
                            if (recordset[p].RecipeID == result[i].recipeID) {
                                result[i].RecipeName = recordset[p].RecipeName;
                            }
                        }
                    }
                    res.send(JSON.stringify(result));
                } else res.send(JSON.stringify("Missing Body structure"));

            });
        });
    } else res.send(JSON.stringify("Missing Device ID"));
});


// API to get weekly distribution of emission on each day
app.get("/api/weekly_report/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        var sql = "select DAYNAME(date_of_entry) AS 'Date', round((sum(emission)),2) AS 'emission' FROM user_food_consumption WHERE deviceID = ? AND date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY date_of_entry ORDER BY DAYOFWEEK(date_of_entry); select DAYNAME(date_of_entry) AS 'Date', round((sum(totalEmission)),2) AS 'emission' FROM user_recipe_consumption WHERE deviceID = ? AND date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY date_of_entry ORDER BY DAYOFWEEK(date_of_entry); "
        con.query(sql, [idDevice, idDevice], function(err, result) {
            if (err) {
                res.send(JSON.stringify("No data found"));
            } else {
                if (result && result.length) {
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
                } else {
                    res.send("No data found");
                }

            }
        });
    } else res.send(JSON.stringify("Missing Device ID"));
});

//API to get carbon emission distribution categorywise
app.get("/api/weekly_category_wise/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        var sql = "SELECT t1.categoryName, ROUND(SUM(emission) , 2) AS 'emission' FROM user_food_consumption t2, FoodType t1 WHERE t2.deviceID = ? AND t2.date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() AND t1.categoryID = t2.categoryID GROUP BY t2.categoryID; select Round(sum(vegEmission),2) as Vegetables, Round(sum(fruitEmission)) as Fruits, Round(sum(meatEmission),2) as Meat, Round(sum(otheremission),2) as Other from user_recipe_consumption WHERE deviceID = ? AND date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY (vegEmission and fruitEmission and meatEmission and otherEmission);";
        con.query(sql, [idDevice, idDevice], function(err, result) {
            if (err) {
                res.send(JSON.stringify("No data found"));
            } else {
                if (result && result.length && result[0] && result[1]) {
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
                        var onlyResp = "select Round(sum(vegEmission),2) as Vegetables, Round(sum(fruitEmission)) as Fruits, Round(sum(meatEmission),2) as Meat, Round(sum(otheremission),2) as Other from user_recipe_consumption WHERE deviceID = ? AND date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY (vegEmission and fruitEmission and meatEmission and otherEmission);";
                        con.query(onlyResp, idDevice, function(err, result) {
                            if (err) {
                                res.send(JSON.stringify("No data found"));
                            }
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
                        var onlyfood = "SELECT t1.categoryName, ROUND(SUM(emission) , 2) AS 'emission' FROM user_food_consumption t2, FoodType t1 WHERE t2.deviceID = ? AND t2.date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() AND t1.categoryID = t2.categoryID GROUP BY t2.categoryID";
                        con.query(onlyfood, idDevice, function(err, result) {
                            if (err) {
                                res.send(JSON.stringify("No data found"));
                            }
                            res.send(JSON.stringify(result));
                        });
                    }
                    // send this response when no data is available
                    else {
                        res.send(JSON.stringify("No data found"));
                    }
                } else {
                    res.send(JSON.stringify("No data found"));
                }
            }
        });
    } else res.send(JSON.stringify("Missing Device ID"));
});

//API to add the list of food items. It will add carbon emission and food category entered by user to database
app.post("/api/addEmission", function(req, res) {
    var dataVal = 0;
    if (req && req.body && req.body.length && req.body[0].categoryName && req.body[dataVal].Foods && req.body[dataVal].date_of_entry) {
        var selectID = req.body[dataVal].categoryName;
        var foodName = req.body[dataVal].Foods;
        var newDate = req.body[dataVal].date_of_entry;
        var date = new Date(newDate);
        console.log("This is date\n" + date);
        const dd = date.getDate();
        const mm = date.getMonth() + 1; // month start at 0, we have to add 1.
        const yyyy = date.getUTCFullYear();
        const now = `${yyyy}-${mm}-${dd}`;
        var sql = "INSERT INTO user_food_consumption (Carbohydrate, deviceID, EmissionsId, emission, categoryID, quantity, Protein, date_of_entry, Fat) VALUES ((select Carbohydrate from food_information where Foods = ? ), '" + req.body[dataVal].deviceID + "', (select EmissionsId from food_information where Foods = ? ) , '" + req.body[dataVal].emission + "', ( select CategoryId from FoodType where CategoryName = ? ),'" + req.body[dataVal].quantity + "',(select Protein from food_information where Foods = ? ),'" + now + "', (select Fat from food_information where Foods = ? ))";
        con.query(sql, [foodName, foodName, selectID, foodName, foodName], function(err, result) {
            if (err) res.send(JSON.stringify("No data found"));
            console.log("Food added Successfully");
            res.send(req.body);
        });
    } else {
        res.send(JSON.stringify("Body Missing"));
    }
});

//API to add the list of recipe items. It will add carbon emission and food category entered by user to database
app.post("/api/add_recipe_emission", function(req, res) {
    if (req && req.body && req.body.length && req.body[0].RecipeName && req.body[0].totalEmission && req.body[0].serves && req.body[0].date_of_entry) {
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
            if (err) res.send(JSON.stringify("No data found"));
            console.log("Recipe added Successfully");
            res.send(req.body);
        });
    } else {
        res.send(JSON.stringify("Body Missing"));

    }
});

app.get("/api/view_food_recommendations/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        var sql = `select EmissionsId, (emission/quantity) as val, categoryID,Fat,Protein,Carbohydrate from user_food_consumption where deviceID = ?  order by val desc limit 1`;
        con.query(sql, idDevice, function(err, rows) {
            if (err) {
                res.send(JSON.stringify("Query Failureg"));
                return;
            }
            if (rows && rows.length) {
                var sqlCat = `select *  from food_information where Emissions < ? AND Fat > ?  AND Carbohydrate > ? AND Protein > ? AND CategoryId = ?`;
                con.query(sqlCat, [rows[0].val, rows[0].Fat, rows[0].Carbs, rows[0].Protein, rows[0].categoryID], function(err, record) {
                    if (err) {
                        res.send(JSON.stringify("Query Failureu"));
                        return;
                    }
                    if (record && record.length) {
                        res.send(record);
                        return;
                    } else {
                        var sqlCat = `select *  from food_information where Emissions < ? AND CategoryId = ? order by Emissions asc limit 10; `;
                        con.query(sqlCat, [rows[0].val, rows[0].categoryID], function(err, recordset) {
                            if (err) {
                                res.send(JSON.stringify("Query Failure"));
                                return;
                            }
                            res.send(recordset);
                        });
                    }
                });
            } else {
                res.send(JSON.stringify("Query Failure"));
                return;
            }
        });
    } else {
        res.send(JSON.stringify("deviceID Missing"));
        return;
    }
});

app.get("/api/view_food_recommendations_newUser", function(req, res) {
    var sql = `select *  from food_information order by Emissions asc limit 10;`;
    con.query(sql, function(err, rows) {
        if (err) {
            res.send(JSON.stringify("Query Failure"));
            return;
        }
        res.send(rows);
    });
});

app.get("/api/view_recipe_recommendations_newUser", function(req, res) {
    var sql = `select *  from recipe_information order by EmissionsPerServe asc limit 10;`;
    con.query(sql, function(err, rows) {
        if (err) {
            res.send(JSON.stringify("Query Failure"));
            return;
        }
        res.send(rows);
    });
});

app.get("/api/view_recipe_recommendationss/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        var sql = `select recipeID, (totalEmission/serves) as emissionVal, round((Protein/serves),2) as Protein, round((Carbohydrate/serves),2) as Carbs,round((Fat/serves),2) as Fat from user_recipe_consumption where deviceID = ?`;
        con.query(sql, idDevice, function(err, rows) {
            if (err) {
                res.send(JSON.stringify("Query Failureg"));
                return;
            }
            if (rows && rows.length) {
                var sqlCat = `select *  from recipe_information where RecipeFatPerServe > ? AND RecipeCarbsPerServe > ?  AND EmissionsPerServe < ? AND RecipeProteinPerServe > ? `;
                con.query(sqlCat, [rows[0].Fat, rows[0].Carbs, rows[0].emissionVal, rows[0].Protein], function(err, record) {
                    if (err) {
                        res.send(JSON.stringify("Query Failureu"));
                        return;
                    }
                    if (record && record.length) {
                        res.send(record);
                        return;
                    } else {
                        var sqlCat = `select *  from recipe_information where EmissionsPerServe < ? order by EmissionsPerServe asc limit 10; `;
                        con.query(sqlCat, rows[0].emissionVal, function(err, recordset) {
                            if (err) {
                                res.send(JSON.stringify("Query Failure"));
                                return;
                            }
                            res.send(recordset);
                        });
                    }
                });
            } else {
                res.send(JSON.stringify("Query Failure"));
                return;
            }
        });
    } else {
        res.send(JSON.stringify("deviceID Missing"));
        return;
    }
});


function sqlQueryRun(sql, res) {
    con.query(sql, function(err, recordset) {
        if (err) res.send(JSON.stringify("No data found"));
        res.send(JSON.stringify(recordset));
    });
}
var con = require('./db/ec2_config');
var app = require('./server/port');
var _ = require('underscore');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(bodyParser.raw());
var async = require('async');

//API to get food emission for all the raw food items - Data table used is food_information
app.get("/api/food_Carbon_Emission", function(req, res) {
    var sql = `select * from food_information;`;
    sqlQueryRun(sql, res);
});

//add food recommendations for users 
app.get("/api/view_food_recommendations/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        async.parallel([getFood_information, getUser_foodInfo(idDevice)],
            function(err, results) {
                if (err) {
                    callback(err);
                    return;
                } else if (results.length > 1) {
                    var userData = results[1].getUser_foodInfo;
                    var foodInfo = results[0].getFood_information;
                    console.log("Inside Foods by User****************************" + JSON.stringify(userData));
                    var arr = [];
                    for (var i = 0; i < userData.length; i++) {
                        var count = 0;
                        for (var j = 0; j < foodInfo.length; j++) {
                            if (Math.round(userData[i].val) > foodInfo[j].Emissions && userData[i].EmissionsId != foodInfo[j].EmissionsId && userData[i].categoryID == foodInfo[j].CategoryId && Math.round(userData[i].Fat) < foodInfo[j].Fat && Math.round(userData[i].Protein) < foodInfo[j].Protein && Math.round(userData[i].Carbohydrate) < foodInfo[j].Carbohydrate) {
                                if (count < 1) {
                                    var foodName = _.findWhere(foodInfo, {
                                        EmissionsId: userData[i].EmissionsId
                                    });
                                    userData[i].Foods = foodName.Foods;
                                    arr.push({
                                        "YourFood": userData[i].Foods,
                                        "BetterFood": foodInfo[j].Foods
                                    });
                                    count++;
                                }
                            } else if (foodInfo[j].Emissions < (userData[i].val) && userData[i].EmissionsId != foodInfo[j].EmissionsId && userData[i].categoryID == foodInfo[j].CategoryId) {
                                if (count < 1) {
                                    var foodName = _.findWhere(foodInfo, {
                                        EmissionsId: userData[i].EmissionsId
                                    });
                                    userData[i].Foods = foodName.Foods;
                                    arr.push({
                                        "YourFood": userData[i].Foods,
                                        "BetterFood": foodInfo[j].Foods
                                    });
                                    count++;
                                }
                            }
                        }
                    }
                    res.send(arr);
                    return;
                } else {
                    res.send(JSON.stringify("No Info"));
                    return;
                }
            });
    } else {
        res.send(JSON.stringify("Missing parameters"));
        return;
    }
});

//View food recommendations
app.get("/api/view_recipe_recommendations/:deviceID", function(req, res) {
    var idDevice = req.params.deviceID;
    async.parallel([getRecipe_information, getUser_recipeInfo(idDevice)],
        function(err, results) {
            if (err) {
                callback(err);
                return;
            } else if (results.length > 1) {
                var userData = results[1].getUser_recipeInfo;
                var foodInfo = results[0].getRecipe_information;
                console.log("Inside Recipe by User****************************" + JSON.stringify(userData));
                var arr = [];
                for (var i = 0; i < userData.length; i++) {
                    var count = 0;
                    for (var j = 0; j < foodInfo.length; j++) {
                        if (foodInfo[j].EmissionsPerServe < userData[i].emissionVal && userData[i].recipeID != foodInfo[j].RecipeID && (userData[i].Fat) < foodInfo[j].RecipeFatPerServe && (userData[i].Protein) < foodInfo[j].RecipeProteinPerServe && (userData[i].Carbs) < foodInfo[j].RecipeCarbsPerServe) {
                            if (count < 1) {
                                var foodName = _.findWhere(foodInfo, {
                                    RecipeID: userData[i].recipeID
                                });
                                userData[i].Foods = foodName.RecipeName;
                                arr.push({
                                    "YourFood": userData[i].Foods,
                                    "BetterFood": foodInfo[j].RecipeName
                                });
                                count++;
                            }
                        } else if (foodInfo[j].EmissionsPerServe < (userData[i].emissionVal) && userData[i].recipeID != foodInfo[j].RecipeID) {
                            if (count < 1) {
                                var foodName = _.findWhere(foodInfo, {
                                    RecipeID: userData[i].recipeID
                                });
                                userData[i].Foods = foodName.RecipeName;
                                arr.push({
                                    "YourFood": userData[i].Foods,
                                    "BetterFood": foodInfo[j].RecipeName
                                });
                                count++;
                            }
                        }
                    }
                    console.log("empty" + JSON.stringify(arr));
                    console.log("Arr Vale" + JSON.stringify(userData[i].recipeID));

                    if (arr == []) {
                        arr.push({
                            "YourFood": userData[i].Foods,
                            "BetterFood": "You have done a great Job"
                        });
                    }
                }
                res.send(arr);
                return;
            }
        });
});

app.delete('/api/delete_recipe_food/:id', function(req, res) {
    if (req && req.params && req.params.id) {
        var idParams = req.params.id;
        var sql = "delete from user_recipe_consumption where ObjectID = ?;";
        con.query(sql, idParams, function(err, results, fields) {
            if (err) {
                res.send(JSON.stringify("No data found"));
                return;
            }
            console.log(JSON.stringify("Record Deleted"));
            res.send(JSON.parse('[{"RecipeName":"Record Deleted"}]'));
            return;
        });
    } else {
        res.send(JSON.stringify("No request body defined"));
        return;
    }
});

app.delete('/api/delete_raw_food/:id', function(req, res) {
    if (req && req.params && req.params.id) {
        var idParams = req.params.id;
        var sql = "delete from user_food_consumption where ObjectID = ?;";
        con.query(sql, idParams, function(err, results, fields) {
            if (err) {
                res.send(JSON.stringify("No data found"));
                return;
            }
            console.log(JSON.stringify("Record Deleted"));
            res.send(JSON.parse('[{"RecipeName":"Record Deleted"}]'));
            return;
        });
    } else {
        res.send(JSON.stringify("No request body defined"));
        return;
    }
});

app.get("/api/view_food_recommendations_newUser", function(req, res) {
    var sql = `select *  from food_information order by Emissions asc limit 10;`;
    con.query(sql, function(err, rows) {
        if (err) {
            res.send(JSON.stringify("Query Failure/Data not found"));
            return;
        }
        res.send(rows);
        return;
    });
});

app.get("/api/view_recipe_recommendations_newUser", function(req, res) {
    var sql = `select RecipeName, round(EmissionsPerServe,2) as EmissionsPerServe, round(RecipeFatPerServe,2) as RecipeFatPerServe, round(RecipeCarbsPerServe,2) as RecipeCarbsPerServe, round(RecipeProteinPerServe,2) as RecipeProteinPerServe from recipe_information order by EmissionsPerServe asc limit 10;`;
    con.query(sql, function(err, rows) {
        if (err) {
            res.send(JSON.stringify("Query Failure/Data not found"));
            return;
        }
        res.send(rows);
        return;
    });
});

//API to return list of food items as per the category given and give EmissionID, name and emission of the food
app.get("/api/food_Carbon_Emission_category/:category", function(req, res) {
    if (req && req.params && req.params.category) {
        var categoryParam = req.params.category;
        var sql = `select EmissionsId, Foods, Emissions from food_information where CategoryId like (select CategoryId from FoodType where CategoryName = ?);`;
        con.query(sql, categoryParam, function(err, recordset) {
            if (err) {
                res.send(JSON.stringify("No data found"));
                return;
            }
            // send records as a response
            console.log('Console in get API for different CategoryName' + JSON.stringify(recordset));
            res.send(JSON.stringify(recordset));
            return;
        });
    } else {
        res.send(JSON.stringify("No request body defined"));
        return;
    }
});

//API to return information of nutrition for last 7 days
app.get("/api/get_nutrition_food/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        var sql = "select DAYNAME(date_of_entry) AS 'Date', round((sum(Fat)),2) AS 'Fat', round((sum(Protein)),2) AS 'Protein', round((sum(Carbohydrate)),2) AS 'Carbohydrate' FROM user_food_consumption WHERE deviceID = ? AND date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY date_of_entry ORDER BY DAYOFWEEK(date_of_entry); select DAYNAME(date_of_entry) AS 'Date', round((sum(Fat)),2) AS 'Fat', round((sum(Protein)),2) AS 'Protein', round((sum(Carbohydrate)),2) AS 'Carbohydrate' FROM user_recipe_consumption WHERE date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY date_of_entry ORDER BY DAYOFWEEK(date_of_entry); "
        con.query(sql, idDevice, function(err, recordset) {
            if (err) {
                res.send(JSON.stringify("No data found"));
                return;
            }
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
                return;
            } else {
                res.send(JSON.stringify("No request body defined"));
                return;
            }

        });
    } else {
        res.send(JSON.stringify("Missing Device ID"));
        return;
    }
});

//rest api to update raw food record into mysql database
app.put('/api/update_raw_food', function(req, res) {
    if (req && req.body && req.body.length && req.body[0].Foods && req.body[0].ObjectID && req.body[0].Quantity) {
        var sqlu = "(select Emissions, Fat, Protein, Carbohydrate from food_information where Foods = ?)";
        con.query(sqlu, req.body[0].Foods, function(error, results) {
            if (error) {
                res.send(JSON.stringify("No data found"));
                return;
            }
            if (results && results.length) {
                var multiplyQuant = (req.body[0].quantity / 100);
                var quantity = req.body[0].quantity;
                var emission = results[0].Emissions * multiplyQuant;
                var fat = results[0].Fat * multiplyQuant;
                var carbs = results[0].Carbohydrate * multiplyQuant;
                var protein = results[0].Protein * multiplyQuant;
                var obID = req.body[0].ObjectID;
                console.log("Info of raw food items" + JSON.stringify(results));
                var sql = "UPDATE user_food_consumption SET quantity=? ,emission=? , Fat=?, Protein=? , Carbohydrate=?  where ObjectID = ?;";
                con.query(sql, [quantity, emission, fat, protein, carbs, obID], function(error, results, fields) {
                    if (error) {
                        res.send(JSON.stringify("No data found"));
                        return;
                    }
                    res.send(req.body);
                    return;
                });
            } else {
                res.send(JSON.stringify("No record found"));
                return;
            }
        });
    } else {
        res.send(JSON.stringify("Missing Body structure"));
        return;
    }
});

//rest api to update recipe record into mysql database
app.put('/api/update_recipe_food', function(req, res) {
    if (req && req.body && req.body.length && req.body[0].RecipeName && req.body[0].ObjectID) {
        var sqlu = "(select EmissionsPerServe,RecipeFatPerServe, RecipeProteinPerServe, RecipeCarbsPerServe,  VegEmissionsPerServe,FruitEmissionsPerServe, MeatEmissionsPerServe, OtherEmissionsPerServe from recipe_information where RecipeName = ?)";
        con.query(sqlu, req.body[0].RecipeName, function(error, results) {
            if (error) {
                res.send(JSON.stringify("No data found"));
                return;
            }
            var sql = "UPDATE user_recipe_consumption SET Protein= ?, Carbohydrate = ?, Fat = ?, serves=?, totalEmission = ?, vegEmission = ? , meatEmission = ?,otherEmission = ?,fruitEmission = ? where ObjectID = ?;"
            if (results && results.length) {
                var serves = req.body[0].serves;
                var vegEmission = results[0].VegEmissionsPerServe ? (results[0].VegEmissionsPerServe * serves) : 0;
                var fruitEmission = results[0].FruitEmissionsPerServe ? (results[0].FruitEmissionsPerServe * serves) : 0;
                var meatEmission = results[0].MeatEmissionsPerServe ? (results[0].MeatEmissionsPerServe * serves) : 0;
                var otherEmission = results[0].OtherEmissionsPerServe ? (results[0].OtherEmissionsPerServe * serves) : 0;
                var fat = results[0].RecipeFatPerServe ? (results[0].RecipeFatPerServe * serves) : 0;
                var protein = results[0].RecipeProteinPerServe ? (results[0].RecipeProteinPerServe * serves) : 0;
                var carbs = results[0].RecipeCarbsPerServe ? (results[0].RecipeCarbsPerServe * serves) : 0;
                var totalEmission = (results[0].EmissionsPerServe) * serves;
                var obID = req.body[0].ObjectID;
                console.log('resultInfo' + JSON.stringify(results));
                con.query(sql, [protein, carbs, fat, serves, totalEmission, vegEmission, meatEmission, otherEmission, fruitEmission, obID], function(error, record, fields) {
                    if (error) {
                        res.send(JSON.stringify("No data found"));
                        return;
                    }
                    res.send(req.body);
                    return;
                });
            } else {
                res.send(JSON.stringify("No record found"));
                return;
            }
        });
    } else {
        res.send(JSON.stringify("Missing Body structure"));
        return;
    }
});

// API to get emission for the day on home screen
app.get("/api/Landing_page/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        var sql = `select round(sum(emission),2) as "rawEmission" from user_food_consumption where deviceID = ? AND date_of_entry = curdate();select round(sum(totalEmission),2) as "recipeEmission" from user_recipe_consumption where deviceID = ? AND date_of_entry = curdate();`;
        con.query(sql, [idDevice, idDevice], function(err, recordset) {
            if (err) {
                res.send(JSON.stringify("No data found"));
                return;
            }
            if (recordset && recordset.length) {
                console.log("Inside Landing page *******\n" + JSON.stringify(recordset));
                var flatData = _.flatten(recordset);
                var rawEmission = flatData[0].rawEmission != null ? (flatData[0].rawEmission) : 0;
                var recipeEmission = flatData[1].recipeEmission != null ? (flatData[1].recipeEmission) : 0;
                var emission = (rawEmission + recipeEmission).toFixed(2);
                res.send(JSON.stringify([{
                    "emission": emission
                }]));
            } else {
                res.send(JSON.stringify("Missing Body structure"));
                return
            }
        });
    } else {
        res.send(JSON.stringify("Missing Device ID"));
        return;
    }
});

// API to get  emission from recipe dataset
app.get("/api/Recipe_Carbon_Emission", function(req, res) {
    var sql = `select RecipeName, round(EmissionsPerServe,2) as EmissionsPerServe, round(RecipeFatPerServe,2) as RecipeFatPerServe, round(RecipeCarbsPerServe,2) as RecipeCarbsPerServe, round(RecipeProteinPerServe,2) as RecipeProteinPerServe from recipe_information;`;
    sqlQueryRun(sql, res);
});

// API to get  list of added food by the user in raw food item list dataset
app.get("/api/view_food_added/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        var sql = `select Foods,EmissionsId  from food_information`;
        con.query(sql, function(err, recordset) {
            if (err) {
                res.send(JSON.stringify("No data found"));
                return;
            }
            var sql = 'select * from user_food_consumption where deviceID = ?';
            con.query(sql, idDevice, function(err, result) {
                if (err) {
                    res.send(JSON.stringify("No data found"));
                    return;
                }
                if (result && result.length) {
                    for (var i = 0; i < result.length; i++) {
                        for (var p = 0; p < recordset.length; p++) {
                            if (recordset[p].EmissionsId == result[i].EmissionsId) {
                                result[i].Foods = recordset[p].Foods;
                            }
                        }
                    }
                    res.send(JSON.stringify(result));
                    return;
                } else {
                    res.send(JSON.parse('[{"Foods":"No food found"}]'));
                    return;
                }
            });
        });
    } else {
        res.send(JSON.stringify("Missing Device ID"));
        return;
    }
});

// API to get  list of added recipe by the user in recipe item list dataset
app.get("/api/view_recipe_added/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        var sql = `select RecipeName,RecipeID  from recipe_information`;
        con.query(sql, function(err, recordset) {
            if (err) {
                res.send(JSON.stringify("No data found"));
                return;
            }
            var sql = 'select  * from user_recipe_consumption where deviceID = ?';
            con.query(sql, idDevice, function(err, result) {
                if (err) {
                    res.send(JSON.stringify("No data found"));
                    return;
                }
                if (result && result.length) {
                    for (var i = 0; i < result.length; i++) {
                        for (var p = 0; p < recordset.length; p++) {
                            if (recordset[p].RecipeID == result[i].recipeID) {
                                result[i].RecipeName = recordset[p].RecipeName;
                            }
                        }
                    }
                    res.send(JSON.stringify(result));
                    return;
                } else {
                    res.send(JSON.parse('[{"Foods":"No recipe found"}]'));
                    return;
                }

            });
        });
    } else {
        res.send(JSON.stringify("Missing Device ID"));
        return;
    }
});

// API to get weekly distribution of emission on each day
app.get("/api/weekly_report/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        var sql = "select DAYNAME(date_of_entry) AS 'Date', round((sum(emission)),2) AS 'emission' FROM user_food_consumption WHERE deviceID = ? AND date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY date_of_entry ORDER BY DAYOFWEEK(date_of_entry); select DAYNAME(date_of_entry) AS 'Date', round((sum(totalEmission)),2) AS 'emission' FROM user_recipe_consumption WHERE deviceID = ? AND date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY date_of_entry ORDER BY DAYOFWEEK(date_of_entry); "
        con.query(sql, [idDevice, idDevice], function(err, result) {
            if (err) {
                res.send(JSON.parse('[{"Foods":"No food found"}]'));
                return;
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
                        return;
                    } else {
                        res.send(JSON.stringify(bargraph));
                        return;
                    }
                } else {
                    res.send(JSON.parse('[{"Foods":"No food found"}]'));
                    return;
                }

            }
        });
    } else {
        res.send(JSON.stringify("Missing Device ID"));
        return;
    }
});

//API to get carbon emission distribution categorywise
app.get("/api/weekly_category_wise/:deviceID", function(req, res) {
    if (req && req.params && req.params.deviceID) {
        var idDevice = req.params.deviceID;
        var sql = "SELECT t1.CategoryName as categoryName, ROUND(SUM(emission) , 2) AS 'emission' FROM user_food_consumption t2, FoodType t1 WHERE t2.deviceID = ? AND t2.date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() AND t1.CategoryId = t2.categoryID GROUP BY t2.categoryID; select Round(sum(vegEmission),2) as Vegetables, Round(sum(fruitEmission)) as Fruits, Round(sum(meatEmission),2) as Meat, Round(sum(otheremission),2) as Other from user_recipe_consumption WHERE deviceID = ? AND date_of_entry BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW() GROUP BY (vegEmission and fruitEmission and meatEmission and otherEmission);";
        con.query(sql, [idDevice, idDevice], function(err, result) {
            if (err) {
                res.send(JSON.stringify("No data found"));
                return;
            } else {
                if (result && result.length) {
                    var categoryEmission = result[0];
                    console.log("CategoryName\n" + JSON.stringify(categoryEmission));
                    var categoryDis = result[1];
                    console.log("CategoryDis\n" + JSON.stringify(categoryDis));
                    // compute total emission from all category when data is present in both tables i.e. for raw food and for recipe
                    var vegEmFood = 0,
                        otherEmFood = 0,
                        meatEmFood = 0,
                        fruitEmFood = 0;
                    vegEmRecipe = 0,
                        otherEmRecipe = 0,
                        meatEmRecipe = 0,
                        fruitEmRecipe = 0;
                    totalVeg = 0,
                        totalOther = 0,
                        totalMeat = 0,
                        totalFruit = 0,
                        responseEm = [];
                    categoryName = "";
                    if (categoryEmission.length > 0) {
                        for (var i = 0; i < categoryEmission.length; i++) {
                            if (categoryEmission[i].categoryName == "Vegetables") {
                                vegEmFood = vegEmFood + categoryEmission[i].emission;
                            }
                            if (categoryEmission[i].categoryName == "Other") {
                                otherEmFood = otherEmFood + categoryEmission[i].emission;
                            }
                            if (categoryEmission[i].categoryName == "Fruits") {
                                console.log("emissssion");
                                fruitEmFood = fruitEmFood + categoryEmission[i].emission;
                            }
                            if (categoryEmission[i].categoryName == "Meat") {
                                meatEmFood = meatEmFood + categoryEmission[i].emission;
                            }
                        }
                    }

                    if (categoryDis.length > 0) {
                        for (var i = 0; i < categoryDis.length; i++) {
                            if (categoryDis[i].Vegetables > 0) {
                                vegEmRecipe = vegEmRecipe + categoryDis[i].Vegetables
                            }
                            if (categoryDis[i].Other > 0) {
                                otherEmRecipe = otherEmRecipe + (categoryDis[i].Other);
                            }
                            if (categoryDis[i].Fruits > 0) {
                                fruitEmRecipe = (fruitEmRecipe + categoryDis[i].Fruits);
                            }
                            if (categoryDis[i].Meat > 0) {
                                meatEmRecipe = meatEmRecipe + (categoryDis[i].Meat);
                            }
                        }
                    }

                    totalVeg = vegEmFood + vegEmRecipe;
                    totalOther = otherEmFood + otherEmRecipe;
                    totalMeat = meatEmRecipe + meatEmFood;
                    totalFruit = fruitEmRecipe + fruitEmFood;
                    if (totalVeg > 0) {
                        responseEm.push({
                            "categoryName": "Vegetables",
                            "emission": totalVeg
                        });
                    }
                    if (totalOther > 0) {
                        responseEm.push({
                            "categoryName": "Other",
                            "emission": totalOther
                        });
                    }
                    if (totalMeat > 0) {
                        responseEm.push({
                            "categoryName": "Meat",
                            "emission": totalMeat
                        });
                    }
                    if (totalFruit > 0) {
                        responseEm.push({
                            "categoryName": "Fruits",
                            "emission": totalFruit
                        });
                    }
                    console.log('Return Call response\n' + JSON.stringify(responseEm));
                    res.send(JSON.stringify(responseEm));
                    return;
                } else {
                    res.send(JSON.stringify("No data found"));
                    return;
                }
            }
        });
    } else {
        res.send(JSON.stringify("Missing Device ID"));
        return;
    }
});

//API to add the list of food items. It will add carbon emission and food category entered by user to database
app.post("/api/addEmission", function(req, res) {
    var dataVal = 0;
    if (req && req.body && req.body.length && req.body[dataVal].categoryName && req.body[dataVal].Foods && req.body[dataVal].date_of_entry && req.body[dataVal].quantity) {
        var selectID = req.body[dataVal].categoryName;
        var foodName = req.body[dataVal].Foods;
        var newDate = req.body[dataVal].date_of_entry;
        var date = new Date(newDate);
        var quantityMul = (req.body[dataVal].quantity / 100);
        console.log("This is date\n" + date);
        const dd = date.getDate();
        const mm = date.getMonth() + 1; // month start at 0, we have to add 1.
        const yyyy = date.getUTCFullYear();
        const now = `${yyyy}-${mm}-${dd}`;
        var sql = "INSERT INTO user_food_consumption (Carbohydrate, deviceID, EmissionsId, emission, categoryID, quantity, Protein, date_of_entry, Fat) VALUES ((select Carbohydrate from food_information where Foods = ? ) * '" + quantityMul + "', '" + req.body[dataVal].deviceID + "', (select EmissionsId from food_information where Foods = ? ) , '" + req.body[dataVal].emission + "' * '" + quantityMul + "', (select CategoryId from FoodType where CategoryName = ? ),'" + req.body[dataVal].quantity + "',(select Protein from food_information where Foods = ? )* '" + quantityMul + "','" + now + "', (select Fat from food_information where Foods = ? ) * '" + quantityMul + "')";
        con.query(sql, [foodName, foodName, selectID, foodName, foodName], function(err, result) {
            if (err) {
                res.send(JSON.stringify("No data found"));
                return;
            }
            console.log("Food added Successfully");
            res.send(req.body);
            return;
        });
    } else {
        res.send(JSON.stringify("Body Missing"));
        return;
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
        var sql = "INSERT INTO user_recipe_consumption (Carbohydrate, Protein , Fat, meatEmission,otherEmission,deviceID, recipeID ,totalEmission, vegEmission ,date_of_entry, fruitEmission,serves) VALUES (( select RecipeCarbsPerServe from recipe_information where RecipeName = ?) * '" + serves + "', ( select RecipeProteinPerServe from recipe_information where RecipeName = ?) * '" + serves + "', ( select RecipeFatPerServe from recipe_information where RecipeName = ?) * '" + serves + "', ( select MeatEmissionsPerServe from recipe_information where RecipeName = ?) * '" + req.body[0].serves + "' ,( select OtherEmissionsPerServe from recipe_information where RecipeName = ?) * '" + req.body[0].serves + "' ,'" + req.body[0].deviceID + "', ( select RecipeID from recipe_information where RecipeName = ?) ,'" + totEmission + "', ( select VegEmissionsPerServe from recipe_information where RecipeName = ? ) * '" + req.body[0].serves + "' , '" + now + "', ( select FruitEmissionsPerServe from recipe_information where RecipeName = ?) * '" + req.body[0].serves + "' , '" + req.body[0].serves + "' )";
        con.query(sql, [RecipeName, RecipeName, RecipeName, RecipeName, RecipeName, RecipeName, RecipeName, RecipeName], function(err, result) {
            if (err) {
                res.send(JSON.stringify("No data found"));
                return;
            }
            console.log("Recipe added Successfully");
            res.send(req.body);
            return;
        });
    } else {
        res.send(JSON.stringify("Body Missing"));
        return;
    }
});

function sqlQueryRun(sql, res) {
    con.query(sql, function(err, recordset) {
        if (err) res.send(JSON.stringify("No data found"));
        res.send(JSON.stringify(recordset));
    });
}

function getUser_foodInfo(deviceId) {
    return function(callback) {
        var sql = `select DISTINCT deviceID, (EmissionsId), round((emission/quantity)*100,2) as val, categoryID, round((Fat/quantity)*100,2) as Fat, round((Protein/quantity)*100,2) as Protein, round((Carbohydrate/quantity)*100,2) as Carbohydrate from user_food_consumption where deviceID = ?`;
        con.query(sql, deviceId, function(err, result) {
            var interimResult = {};
            interimResult.getUser_foodInfo = result;
            callback(null, interimResult);
        });
    }
}

function getFood_information(callback) {
    var sql = 'select *  from food_information';
    con.query(sql, function(err, result) {
        var interimResult = {};
        interimResult.getFood_information = result;
        callback(null, interimResult);
    });
}

function getUser_recipeInfo(deviceId) {
    return function(callback) {
        var sql = `select Distinct recipeID, (totalEmission/serves) as emissionVal, round((Protein/serves),2) as Protein, round((Carbohydrate/serves),2) as Carbs,round((Fat/serves),2) as Fat from user_recipe_consumption where deviceID = ?`;
        con.query(sql, deviceId, function(err, result) {
            var interimResult = {};
            interimResult.getUser_recipeInfo = result;
            callback(null, interimResult);
        });
    }
}

function getRecipe_information(callback) {
    var sql = 'select RecipeID,RecipeName, round(EmissionsPerServe,2) as EmissionsPerServe, round(RecipeFatPerServe,2) as RecipeFatPerServe, round(RecipeCarbsPerServe,2) as RecipeCarbsPerServe, round(RecipeProteinPerServe,2) as RecipeProteinPerServe from recipe_information';
    con.query(sql, function(err, result) {
        var interimResult = {};
        interimResult.getRecipe_information = result;
        callback(null, interimResult);
    });
}
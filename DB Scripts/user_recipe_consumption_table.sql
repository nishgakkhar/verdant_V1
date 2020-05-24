CREATE TABLE IF NOT EXISTS user_recipe_consumption (
ObjectID INT NOT NULL AUTO_INCREMENT,
deviceID varchar(255) NULL,
recipeID INT,
totalEmission FLOAT NULL,
vegEmission FLOAT NULL,
fruitEmission FLOAT NULL,
otherEmission FLOAT NULL,
meatEmission FLOAT NULL,
date_of_entry DATE NULL,
Protein FLOAT NULL,
Fat FLOAT NULL,
Carbohydrate FLOAT NULL,
serves Float Null,
PRIMARY KEY (ObjectID),
FOREIGN KEY (recipeID) REFERENCES RecipeEmissions(recipeID)
);
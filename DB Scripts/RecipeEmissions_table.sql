CREATE TABLE IF NOT EXISTS RecipeEmissions (
RecipeID INT NOT NULL,
RecipeName VARCHAR(500) NULL,
Serves INT NULL,
Details VARCHAR(500) NULL,
VegetableEmissions FLOAT NULL,
VegEmissionsPerServe FLOAT NULL,
MeatEmissions FLOAT NULL,
MeatEmissionsPerServe FLOAT NULL,
FruitEmissions INT NULL,
FruitEmissionsPerServe INT NULL,
OtherEmissions FLOAT NULL,
OtherEmissionsPerServe FLOAT NULL,
RecipeTotalEmission FLOAT NULL,
EmissionsPerServe FLOAT NULL,
PRIMARY KEY (RecipeID)
);
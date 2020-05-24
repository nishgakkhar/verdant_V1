CREATE TABLE IF NOT EXISTS food_information (
EmissionsId INT NOT NULL,
Foods VARCHAR(255) NULL,
Emissions FLOAT NULL,
CategoryId INT NULL,
Protein FLOAT NULL,
Fat FLOAT NULL,
Carbohydrate FLOAT NULL,
PRIMARY KEY(EmissionsId)
);

CREATE TABLE IF NOT EXISTS FoodType (
CategoryId INT NOT NULL,
CategoryName VARCHAR(255) NULL,
PRIMARY KEY (CategoryId)
);
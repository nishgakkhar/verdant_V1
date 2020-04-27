CREATE TABLE IF NOT EXISTS FoodType (
CategoryId INT NOT NULL,
CategoryName VARCHAR(255) NULL,
PRIMARY KEY (CategoryId)
);

CREATE TABLE IF NOT EXISTS FoodEmissions (
EmissionsId INT NOT NULL,
Foods VARCHAR(255) NULL,
Emissions FLOAT NULL,
CategoryId INT NULL,
PRIMARY KEY (EmissionsId),
FOREIGN KEY (CategoryId) REFERENCES FoodType(CategoryId)
);


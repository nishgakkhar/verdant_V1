CREATE TABLE IF NOT EXISTS FoodNutrients (
EmissionsId INT NOT NULL,
Foods VARCHAR(255) NULL,
Protein FLOAT NULL,
Fat FLOAT NULL,
Carbohydrate FLOAT NULL,
FOREIGN KEY (EmissionsId) REFERENCES FoodEmissions(EmissionsId)
);
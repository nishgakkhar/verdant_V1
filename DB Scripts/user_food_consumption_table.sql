CREATE TABLE IF NOT EXISTS user_food_consumption (
ObjectID INT NOT NULL AUTO_INCREMENT,
deviceID varchar(255) NULL,
EmissionsId INT,
emission FLOAT NULL,
categoryID INT,
date_of_entry DATE NULL,
quantity Float Null,
Protein FLOAT NULL,
Fat FLOAT NULL,
Carbohydrate FLOAT NULL,
PRIMARY KEY (ObjectID),
FOREIGN KEY (CategoryId) REFERENCES FoodType(CategoryId),
FOREIGN KEY (EmissionsId) REFERENCES food_information(EmissionsId)
);
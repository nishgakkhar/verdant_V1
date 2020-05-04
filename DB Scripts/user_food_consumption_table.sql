CREATE TABLE IF NOT EXISTS user_food_consumption (
deviceID varchar(255) NULL,
foods VARCHAR(255) NULL,
emission FLOAT NULL,
categoryID INT NULL,
date_of_entry DATE NULL,
ObjectID INT NOT NULL AUTO_INCREMENT,
PRIMARY KEY (ObjectID),
FOREIGN KEY (CategoryId) REFERENCES FoodType(CategoryId)
);
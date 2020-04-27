CREATE TABLE IF NOT EXISTS user_food_consumption (
UserId INT NOT NULL,
Foods VARCHAR(255) NULL,
emission FLOAT NULL,
categoryName VARCHAR(255) NULL,
date_of_entry DATE NULL,
PRIMARY KEY (UserId)
);
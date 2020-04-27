CREATE TABLE IF NOT EXISTS user_food_consumption (
UserId INT NULL,
Foods VARCHAR(255) NULL,
emission FLOAT NULL,
categoryName VARCHAR(255) NULL,
date_of_entry TIMESTAMP NOT NULL,
PRIMARY KEY (date_of_entry)
);
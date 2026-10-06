const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const Book = sequelize.define("Book", {
  title: { type: DataTypes.STRING, allowNull: false },
  author: { type: DataTypes.STRING },
  cover_image: { type: DataTypes.STRING },
  price: { type: DataTypes.FLOAT, allowNull: false },
  sample_url: { type: DataTypes.STRING },
  full_content_url: { type: DataTypes.STRING }
});

module.exports = Book;

const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");
const Book = require("./Book");

const Testimonial = sequelize.define("Testimonial", {
  name: { type: DataTypes.STRING },
  review: { type: DataTypes.TEXT },
  rating: { type: DataTypes.INTEGER }
});

Book.hasMany(Testimonial);
Testimonial.belongsTo(Book);

module.exports = Testimonial;

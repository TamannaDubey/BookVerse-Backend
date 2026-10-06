const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");
const User = require("./User");
const Book = require("./Book");

const Purchase = sequelize.define("Purchase", {
  payment_id: { type: DataTypes.STRING, allowNull: false },
  purchased_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

User.hasMany(Purchase);
Purchase.belongsTo(User);

Book.hasMany(Purchase);
Purchase.belongsTo(Book);

module.exports = Purchase;

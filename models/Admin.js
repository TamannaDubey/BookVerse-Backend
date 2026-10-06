const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const Admin = sequelize.define("Admin", {
  email: { type: DataTypes.STRING, unique: true },
  role: { type: DataTypes.STRING },
  password_hash: { type: DataTypes.STRING }
});

module.exports = Admin;

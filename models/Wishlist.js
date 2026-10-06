const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");
const User = require("./User");
const Book = require("./Book");

const Wishlist = sequelize.define(
  "Wishlist",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    BookId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["UserId", "BookId"],
      },
    ],
  }
);

User.hasMany(Wishlist, {
  foreignKey: "UserId",
  onDelete: "CASCADE",
});

Wishlist.belongsTo(User, {
  foreignKey: "UserId",
});

Book.hasMany(Wishlist, {
  foreignKey: "BookId",
  onDelete: "CASCADE",
});

Wishlist.belongsTo(Book, {
  foreignKey: "BookId",
});

module.exports = Wishlist;
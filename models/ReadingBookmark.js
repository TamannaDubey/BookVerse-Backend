const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const User = require("./User");
const Book = require("./Book");

const ReadingBookmark = sequelize.define(
  "ReadingBookmark",
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

    page_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    page_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["UserId", "BookId"],
      },
    ],
  }
);

User.hasMany(ReadingBookmark, {
  foreignKey: "UserId",
  onDelete: "CASCADE",
});

ReadingBookmark.belongsTo(User, {
  foreignKey: "UserId",
});

Book.hasMany(ReadingBookmark, {
  foreignKey: "BookId",
  onDelete: "CASCADE",
});

ReadingBookmark.belongsTo(Book, {
  foreignKey: "BookId",
});

module.exports = ReadingBookmark;
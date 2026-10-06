const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const User = require("./User");
const Book = require("./Book");

const ReadingHistory = sequelize.define(
  "ReadingHistory",
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

    current_page: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    total_pages: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    progress: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },

    last_read_at: {
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

User.hasMany(ReadingHistory, {
  foreignKey: "UserId",
  onDelete: "CASCADE",
});

ReadingHistory.belongsTo(User, {
  foreignKey: "UserId",
});

Book.hasMany(ReadingHistory, {
  foreignKey: "BookId",
  onDelete: "CASCADE",
});

ReadingHistory.belongsTo(Book, {
  foreignKey: "BookId",
});

module.exports = ReadingHistory;
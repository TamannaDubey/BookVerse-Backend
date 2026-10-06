const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");
const User = require("./User");
const Book = require("./Book");

const Highlight = sequelize.define(
  "Highlight",
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

    highlighted_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    page_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
  }
);

// User → Highlights
User.hasMany(Highlight, {
  foreignKey: "UserId",
  onDelete: "CASCADE",
});

Highlight.belongsTo(User, {
  foreignKey: "UserId",
});

// Book → Highlights
Book.hasMany(Highlight, {
  foreignKey: "BookId",
  onDelete: "CASCADE",
});

Highlight.belongsTo(Book, {
  foreignKey: "BookId",
});

module.exports = Highlight;
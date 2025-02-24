const { DataTypes } = require("sequelize");
const sequelize = require("../db"); // Ensure db connection is correct

const Lead = sequelize.define("Lead", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  address: { type: DataTypes.STRING, allowNull: false },
  city: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  zip: { type: DataTypes.STRING, allowNull: false },
  owner: { type: DataTypes.STRING, allowNull: false },
  images: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: "Lead" },
  notes: { type: DataTypes.STRING, allowNull: true },
});

module.exports = Lead;

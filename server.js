const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const cors = require("cors");
const bodyParser = require("body-parser");

require("dotenv").config(); // Load environment variables

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json()); // Ensure JSON parsing is enabled

// Connect to PostgreSQL with Sequelize
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: "postgres",
  logging: false, // Disable logging
});

// Define Leads Model
const Lead = sequelize.define(
  "Lead",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    address: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    zip: { type: DataTypes.STRING, allowNull: false },
    owner: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: "leads", timestamps: false }
);

// Fetch all leads (GET route)
app.get("/api/leads", async (req, res) => {
  try {
    const leads = await Lead.findAll(); // Fetch all leads from DB
    res.json(leads); // Return leads as JSON response
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a new lead (POST route)
app.post("/api/leads", async (req, res) => {
  try {
    const { address, city, state, zip, owner } = req.body;
    const newLead = await Lead.create({ address, city, state, zip, owner });
    res.status(201).json(newLead); // Return the newly created lead
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({ error: "Error creating lead" });
  }
});

// Delete a lead (DELETE route)
app.delete("/api/leads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLead = await Lead.destroy({ where: { id } });

    if (deletedLead) {
      res.json({ message: "Lead deleted successfully" });
    } else {
      res.status(404).json({ error: "Lead not found" });
    }
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ error: "Error deleting lead" });
  }
});


// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected...");
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});

const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // FIX: Parse form fields correctly
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Connect to PostgreSQL with Sequelize
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: "postgres",
  logging: false,
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
    images: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "Lead" },
  },
  { tableName: "leads", timestamps: false }
);

// Fetch all leads (GET route)
app.get("/api/leads", async (req, res) => {
  try {
    const leads = await Lead.findAll({
      attributes: ["id", "address", "city", "state", "zip", "owner", "images", "status"], // Ensure "images" is included
    });

    const formattedLeads = leads.map((lead) => ({
      ...lead.toJSON(),
      images: lead.images || [], // Ensure images is always an array
    }));

    res.json(formattedLeads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a new lead without an image (POST route)
app.post("/api/leads", async (req, res) => {
  try {
    const { address, city, state, zip, owner, images, status } = req.body;

    console.log("📥 Received lead data:", req.body);

    // Validate required fields
    if (!address || !city || !state || !zip || !owner) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Save lead in DB
    const newLead = await Lead.create({ address, city, state, zip, owner, images, status: status || "Lead" });

    res.status(201).json(newLead);
  } catch (error) {
    console.error("Error adding lead:", error);
    res.status(500).json({ error: "Error adding lead" });
  }
});

app.put("/api/leads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { address, city, state, zip, owner, status } = req.body;

    const updatedLead = await Lead.update(
      { address, city, state, zip, owner, status },
      { where: { id } }
    );

    if (updatedLead[0] === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.json({ message: "Lead updated successfully" });
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Error updating lead" });
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
    
// Upload Image and Add Property
app.post("/api/upload", upload.array("files", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imageUrls = req.files.map(file => `http://localhost:5001/uploads/${file.filename}` );
    const { address, city, state, zip, owner } = req.body;

    console.log("received form data:", req.body);

    // Validate required fields
    if (!address || !city || !state || !zip || !owner) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Save lead with image URL
    const newLead = await Lead.create({ address, city, state, zip, owner, images: imageUrls });

    console.log("New lead saved:", newLead);

    res.status(201).json(newLead);
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({ error: "Error uploading images" });
  }
});

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

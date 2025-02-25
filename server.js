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
    name: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    zip: { type: DataTypes.STRING, allowNull: false },
    owner: { type: DataTypes.STRING, allowNull: true },
    images: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "Lead" },
  },
  { tableName: "leads", timestamps: false }
);

// Fetch all leads (GET route)
app.get("/api/leads", async (req, res) => {
  try {
    const leads = await Lead.findAll({
      attributes: ["name", "id", "address", "city", "state", "zip", "owner", "images", "status"], // Ensure "images" is included
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
    const { name, address, city, state, zip, owner, images, status } = req.body;

    console.log("📥 Received lead data:", req.body);

    // Validate required fields
    if (!address || !city || !state || !zip || !owner) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Save lead in DB
    const newLead = await Lead.create({ name: name || null, address, city, state, zip, owner, images, status: status || "Lead" });

    res.status(201).json(newLead);
  } catch (error) {
    console.error("Error adding lead:", error);
    res.status(500).json({ error: "Error adding lead" });
  }
});

app.put("/api/leads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, city, state, zip, owner, status, images } = req.body;

    // Validate input
    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.name = name;
    if (address !== undefined) fieldsToUpdate.address = address;
    if (city !== undefined) fieldsToUpdate.city = city;
    if (state !== undefined) fieldsToUpdate.state = state;
    if (zip !== undefined) fieldsToUpdate.zip = zip;
    if (owner !== undefined) fieldsToUpdate.owner = owner;
    if (status !== undefined) fieldsToUpdate.status = status;
    if (images !== undefined) fieldsToUpdate.images = images;

    const updatedLead = await Lead.update(fieldsToUpdate, { where: { id } });

    if (updatedLead[0] === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // ✅ Fetch updated lead data from DB and return it
    const lead = await Lead.findByPk(id);
    res.json(lead);

  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
app.post("/api/upload", (req, res, next) => {
  let uploadMiddleware;

  if (req.files && req.files.length > 0) {
    uploadMiddleware = upload.array("files", 5); // Handle multiple images
  } else {
    uploadMiddleware = upload.single("file"); // Handle single image
  }

  uploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(500).json({ error: "Upload failed", details: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Handle single and multiple image uploads
    const imageUrls = req.file
      ? [`http://localhost:5001/uploads/${req.file.filename}`] // Single file case
      : req.files.map((file) => `http://localhost:5001/uploads/${file.filename}`); // Multiple files case

    res.json({ imageUrls }); // ✅ Return array of image URLs

  } catch (error) {
    console.error("❌ Error uploading images:", error);
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

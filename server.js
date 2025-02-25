const express = require("express");
const { Sequelize, DataTypes, Op } = require("sequelize");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Connect to PostgreSQL with Sequelize
const sequelize = new Sequelize(process.env.DB_URL, { dialect: "postgres", logging: false });

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
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "Lead" }
  },
  { tableName: "leads", timestamps: false }
);

// ✅ **QUICK STATS API**
app.get("/api/stats", async (req, res) => {
  try {
    const totalLeads = await Lead.count();
    const dealsClosed = await Lead.count({ where: { status: "Sale" } });
    const propertiesContacted = await Lead.count({ where: { status: "Contact" } });
    const offersMade = await Lead.count({ where: { status: "Offer" } });
    const activeListings = await Lead.count({ where: { status: { [Op.in]: ["Lead", "Offer", "Contact"] } } });

    // Calculate percentage of deals closed
    const percentageDealsClosed = totalLeads > 0 ? ((dealsClosed / totalLeads) * 100).toFixed(2) : "0.00";

    res.json({
      totalLeads,
      dealsClosed,
      propertiesContacted,
      offersMade,
      activeListings,
      percentageDealsClosed: percentageDealsClosed + "%"
    });

  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ **Fetch all leads**
app.get("/api/leads", async (req, res) => {
  try {
    const leads = await Lead.findAll({
      attributes: ["name", "id", "address", "city", "state", "zip", "owner", "images", "status"]
    });

    res.json(leads.map(lead => ({ ...lead.toJSON(), images: lead.images || [] })));
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ **Add a new lead**
app.post("/api/leads", async (req, res) => {
  try {
    const { name, address, city, state, zip, owner, images, status } = req.body;

    if (!address || !city || !state || !zip || !owner) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newLead = await Lead.create({ name, address, city, state, zip, owner, images, status: status || "Lead" });
    res.status(201).json(newLead);
  } catch (error) {
    console.error("Error adding lead:", error);
    res.status(500).json({ error: "Error adding lead" });
  }
});

// ✅ **Update a lead**
app.put("/api/leads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, city, state, zip, owner, status, images } = req.body;

    const updatedLead = await Lead.update({ name, address, city, state, zip, owner, status, images }, { where: { id } });

    if (updatedLead[0] === 0) return res.status(404).json({ error: "Lead not found" });

    res.json(await Lead.findByPk(id));
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ **Delete a lead**
app.delete("/api/leads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLead = await Lead.destroy({ where: { id } });

    if (deletedLead) res.json({ message: "Lead deleted successfully" });
    else res.status(404).json({ error: "Lead not found" });
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ error: "Error deleting lead" });
  }
});

// ✅ **Upload Image**
app.post("/api/upload", (req, res, next) => {
  const uploadMiddleware = req.files ? upload.array("files", 5) : upload.single("file");
  uploadMiddleware(req, res, (err) => {
    if (err) return res.status(500).json({ error: "Upload failed", details: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imageUrls = req.file
      ? [`http://10.0.2.2:5001/api/uploads/${req.file.filename}`]
      : req.files.map(file => `http://10.0.2.2:5001/api/uploads/${file.filename}`);

    res.json({ imageUrls });

  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({ error: "Error uploading images" });
  }
});

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ **Start Server**
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
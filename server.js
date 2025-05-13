const express = require("express");
const { Sequelize, DataTypes, Op } = require("sequelize");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" })); // or more, like "20mb"
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
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
    userId: { type: DataTypes.STRING, allowNull: false, references: { model: "users", key: "id" } },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "leads", timestamps: false }
);

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.STRING, primaryKey: true }, // Use Google ID as primary key
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    picture: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: "users", timestamps: true }
);

function saveBase64Image(base64String, uploadDir = "uploads") {
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) throw new Error("Invalid base64 image");

  const mimeType = matches[1];
  const extension = mimeType.split("/")[1];
  const base64Data = matches[2];
  const filename = `${Date.now()}.${extension}`;
  const filepath = path.join(uploadDir, filename);

  fs.writeFileSync(filepath, Buffer.from(base64Data, "base64"));
  return `http://localhost:5001/uploads/${filename}`; // Return public path
}


app.post("/api/users", async (req, res) => {
  try {
    const { id, name, email, picture } = req.body;

    if (!id || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("🔥 Received user:", req.body); // Debugging

    // Ensure user ID is a string (Google provides string IDs)
    const userId = String(id);

    // Check if user already exists
    let user = await User.findByPk(userId);
    if (!user) {
      user = await User.create({ id: userId, name, email, picture });
      console.log("✅ User created:", user.toJSON());
    } else {
      console.log("ℹ️ User already exists:", user.toJSON());
    }

    res.status(201).json(user);
  } catch (error) {
    console.error("❌ Error saving user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const totalLeads = await Lead.count({ where: { userId } });
    const dealsClosed = await Lead.count({ where: { userId, status: "Sale" } });
    const propertiesContacted = await Lead.count({ where: { userId, status: "Contact" } });
    const offersMade = await Lead.count({ where: { userId, status: "Offer" } });
    const activeListings = await Lead.count({ 
      where: { 
        userId, 
        status: { [Op.in]: ["Lead", "Offer", "Contact"] } 
      } 
    });

    const percentageDealsClosed = totalLeads > 0
      ? ((dealsClosed / totalLeads) * 100).toFixed(2)
      : "0.00";

    res.json({
      totalLeads,
      dealsClosed,
      propertiesContacted,
      offersMade,
      activeListings,
      percentageDealsClosed: `${percentageDealsClosed}%`
    });

  } catch (error) {
    console.error("Error fetching user-specific stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




// Fetch all leads (GET route)
app.get("/api/leads/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const leads = await Lead.findAll({
      where: { userId }, // 🔥 Fetch leads for a specific user
      attributes: ["name", "id", "address", "city", "state", "zip", "owner", "images", "status", "notes"],
    });

    res.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Add a new lead without an image (POST route)
app.post("/api/leads", async (req, res) => {
  try {
    const { name, address, city, state, zip, owner, images, status, notes, userId } = req.body;

    console.log("📥 Received lead data:", req.body);

    if (!address || !city || !state || !zip || !owner || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify that the user exists
    // const user = await User.findByPk(userId);
    // if (!user) {
    //   return res.status(404).json({ error: "User not found" });
    // }

    const processedImages = Array.isArray(images)
      ? images.map(img => img.startsWith("data:") ? saveBase64Image(img) : img)
      : [];

    const newLead = await Lead.create({
      name: name || null,
      address,
      city,
      state,
      zip,
      owner,
      status: status || "Lead",
      images: processedImages,
      notes,
      userId,
    });


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
    if (images !== undefined) {
      fieldsToUpdate.images = Array.isArray(images)
        ? images.map(img => img.startsWith("data:") ? saveBase64Image(img) : img)
        : [];
    }

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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/chat", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required." });
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 2048,
      },
    });

    const prompt = question;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    res.status(500).json({ error: "Failed to get response from Gemini API.", details: error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Database connected...");
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});

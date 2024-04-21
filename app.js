const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

// Define a Mongoose schema for the user
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

// Define a Mongoose schema for the subscription
const subscriptionSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  plan: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: String, required: true },
});

// Create Mongoose models based on the schemas
const User = mongoose.model("User", userSchema);
const Subscription = mongoose.model("Subscription", subscriptionSchema);

// Connect to MongoDB database
mongoose
  .connect("mongodb://localhost:27017/bcrypt")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Endpoint for user registration
app.post("/api/users", async (req, res) => {
  const { username, password } = req.body;

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user document with hashed password
  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();

  res.status(201).json({ message: "User registered successfully" });
});

// Endpoint for user login
app.post("/api/users/login", async (req, res) => {
  const { username, password } = req.body;

  // Find the user by username
  const user = await User.findOne({ username });

  // Check if user exists
  if (!user) {
    return res.status(400).json({ message: "Invalid username or password" });
  }

  // Check if the provided password matches the stored hashed password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid username or password" });
  }

  res.status(200).json({ message: "Login successful" });
});

// Endpoint for subscription creation
app.post("/api/subscriptions", async (req, res) => {
    const { user_id, plan, price, duration } = req.body;
  
    // Validate request body
    if (!user_id || !plan || !price || !duration) {
      return res.status(400).json({ message: "All fields are required" });
    }
  
    try {
      // Create a new subscription document
      const newSubscription = new Subscription({ user_id, plan, price, duration });
      await newSubscription.save();
  
      res.status(201).json({ message: "Subscription created successfully" });
    } catch (error) {
      // Handle validation errors
      if (error.name === "ValidationError") {
        return res.status(400).json({ message: error.message });
      }
      // Handle other errors
      res.status(500).json({ message: "Internal server error" });
    }
  });

// Endpoint to fetch all subscriptions
app.get("/api/subscriptions", async (req, res) => {
  const allSubscriptions = await Subscription.find({});
  res.status(200).json(allSubscriptions);
});

// Endpoint to delete a subscription by ID
app.delete("/api/subscriptions/:id", async (req, res) => {
  const { id } = req.params;

  const deletedSubscription = await Subscription.findByIdAndDelete(id);
  res.status(200).json({ message: "Subscription deleted successfully" });
});

const PORT = 4000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
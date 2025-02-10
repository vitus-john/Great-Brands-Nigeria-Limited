const express = require("express");
const session = require("express-session");
const { createClient } = require("redis")
const { RedisStore } = require("connect-redis"); 
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cron = require("node-cron");
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require('./routes/paystackRoutes') // ✅ Fix incorrect import
const { verifyToken } = require("./middleware/authMiddleware");

require("dotenv").config();
const app = express();

// Initialize Redis client
const redisClient = createClient();
redisClient.connect().catch(console.error);

// Initialize Redis store
const redisStore = new RedisStore({
  client: redisClient,
  prefix: "myapp:",
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(cookieParser());

// Configure session middleware with Redis
app.use(
  session({
    store: redisStore,
    resave: false, // Force lightweight session keep-alive
    saveUninitialized: false, // Only save session when data exists
    secret: process.env.SESSION_SECRET || "keyboard cat",
  })
);

// Apply verifyToken middleware to all booking routes
app.use(verifyToken);
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes); // ✅ Fix incorrect import

// Schedule a task to run daily at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const [events] = await db.execute(
      'UPDATE events SET status = "expired" WHERE date < NOW() AND status = "active"'
    );
    console.log(`Marked ${events.affectedRows} events as expired`);
  } catch (error) {
    console.error("Failed to update expired events:", error);
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server }; // ✅ Export both app and server
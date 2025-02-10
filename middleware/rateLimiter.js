const rateLimit = require("express-rate-limit");
const redisClient = require("../config/redis");

const WINDOW_SECONDS = 60; // Time window in seconds
const MAX_REQUESTS = 10; // Maximum requests per window

const rateLimiter = async (req, res, next) => {
  try {
    const key = req.user ? `rate:${req.user.id}` : `rate:${req.ip}`;
    const current = await redisClient.get(key);

    if (current && current >= MAX_REQUESTS) {
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }

    if (!current) {
      await redisClient.setEx(key, WINDOW_SECONDS, 1);
    } else {
      await redisClient.incr(key);
    }

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    res.status(500).json({ message: "Rate limiting failed" });
  }
};

module.exports = rateLimiter;

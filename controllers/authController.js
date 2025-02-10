const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateOTP, sendEmail, sendOTPEmail } = require('../utils/email');
const { generateTokens } = require("../utils/jwt");
const { db, redisClient } = require("../config/db"); // Import MySQL pool & Redis
const { createUser, findUserByEmail, verifyUser } = require("../models/userModel");
require("dotenv").config();

// Helper function to check Redis connection
const isRedisConnected = redisClient && redisClient.isReady;

// Register User
const registerUser = async (req, res) => {
  try {
    const { firstname, lastname, username, email, password } = req.body;
    
    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userId = await createUser({ firstname, lastname, username, email, password: hashedPassword, role: 'user' });

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
    await sendEmail({ firstname, email }, token);

    res.status(201).json({ message: "Check your email for verification" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
};

// Verify User
const verifyUserController = async (req, res) => {
  try {
    const token = req.params.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await verifyUser(decoded.id);
    res.redirect('/success');
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired verification link" });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const connection = await db.getConnection();
    
    try {
      const [results] = await connection.execute(
        "SELECT id, email, password, role, isVerified FROM users WHERE email = ?", 
        [email]
      );

      if (results.length === 0) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const user = results[0];

      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      if (!user.isVerified) {
        return res.status(400).json({ message: "Account not verified" });
      }

      // Generate JWT Tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Store Refresh Token & Mark User as Active in Redis
      if (isRedisConnected) {
        await redisClient.setEx(`refreshToken:${user.id}`, 7 * 24 * 60 * 60, refreshToken);
        await redisClient.setEx(`user:${user.id}:status`, 900, "online");
      }

      res.json({ message: "Login successful", accessToken, refreshToken });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ message: "Login error", error });
  }
};


// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const storedOTP = redisClient.isReady ? await redisClient.get(`otp:${email}`) : null;

    if (!storedOTP || storedOTP !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const [results] = await db.execute("SELECT id, email FROM users WHERE email = ?", [email]);

    if (results.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = results[0];

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Delete OTP from Redis
    await redisClient.del(`otp:${email}`);

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "OTP verification error", error });
  }
};


exports.getUserProfile = (req, res) => {
    const userId = req.user.id;
  
    // Fetch user profile from MySQL
    db.query("SELECT id, email, username FROM users WHERE id = ?", [userId], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
  
      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.status(200).json(results[0]);
    });
  };

  const verifyRole = (roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access forbidden: Insufficient permissions" });
      }
      next();
    };
  };
  

  const logoutUser = async (req, res) => {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ message: "No token provided" });
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      if (isRedisConnected) {
        await redisClient.del(`refreshToken:${decoded.id}`);
        await redisClient.del(`user:${decoded.id}:status`);
        await redisClient.setEx(`blacklist:${token}`, 900, "expired");
      } else {
        console.error("❌ Redis is not connected. Skipping logout token blacklist.");
      }
  
      res.json({ message: "Logout successful" });
    } catch (error) {
      res.status(500).json({ message: "Logout error", error });
    }
  };

  // Get logged-in user details

  const getLoggedInUser = async (req, res, next) => {
    const userId = req.user.id;
  
    try {
      const [user] = await db.execute('SELECT id, email FROM users WHERE id = ?', [userId]);
      if (!user.length) {
        return res.status(404).json({ message: 'User not found' });
      }
      req.user = user[0]; // Attach user details to the request object
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch user details' });
    }
  };
  
  
module.exports = { registerUser, verifyUserController, loginUser, verifyOtp, getLoggedInUser, logoutUser };

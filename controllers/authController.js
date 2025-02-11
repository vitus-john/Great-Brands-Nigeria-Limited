const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateOTP, sendEmail, sendOTPEmail } = require('../utils/email');
const { generateTokens } = require("../utils/jwt");
const { db, redisClient, queryDatabase } = require("../config/db"); // Import MySQL pool & Redis

require("dotenv").config();

// Helper function to check Redis connection
const isRedisAvailable = async () => {
  try {
    if (!redisClient.isReady) {
      await redisClient.connect();
    }
    return true;
  } catch {
    return false;
  }
};


// Register User
const registerUser = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log("🔍 Checking if user exists:", email);
    const existingUser = await queryDatabase("SELECT * FROM users WHERE email = ?", [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Hashed Password:", hashedPassword);

    const otp = generateOTP(); // Generate OTP
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // ✅ Insert user into the database
    const insertQuery = `INSERT INTO users (name, email, password, username, role, isVerified, otp, otpExpires, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    const result = await queryDatabase(insertQuery, [name, email, hashedPassword, username, role, 0, otp, otpExpires]);

    const user = { id: result.insertId, email, name, otp };
    await sendOTPEmail(user, otp); // Send OTP email

    if (result.affectedRows > 0) {
      console.log("✅ User registered successfully:", email);
      return res.status(201).json({ message: "Registration successful. Verify your email using the OTP sent." });
    } else {
      console.log("❌ User registration failed");
      return res.status(500).json({ message: "User registration failed" });
    }
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Verify User
const verifyUser = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    console.log("🔍 Verifying token:", token);
    const result = await queryDatabase("SELECT * FROM users WHERE verificationToken = ?", [token]);

    if (result.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // ✅ Mark user as verified
    await queryDatabase("UPDATE users SET isVerified = 1, verificationToken = NULL WHERE verificationToken = ?", [token]);
    console.log("✅ User verified successfully");

    res.json({ message: "Account verified successfully. You can now log in." });
  } catch (error) {
    console.error("❌ Verification Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Logging in user:', { email });

    const connection = await db.getConnection();
    console.log('Database connection acquired');

    try {
      const [results] = await connection.execute(
        "SELECT id, email, password, role, isVerified FROM users WHERE email = ?", 
        [email]
      );

      if (results.length === 0) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const user = results[0];
      console.log('User found:', user);

      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      if (!user.isVerified) {
        return res.status(400).json({ message: "Account not verified" });
      }

      // Generate JWT Tokens
      const { accessToken, refreshToken } = generateTokens(user);
      console.log('Tokens generated');

      // Store Refresh Token & Mark User as Active in Redis
      if (isRedisAvailable) {
        await redisClient.setEx(`refreshToken:${user.id}`, 7 * 24 * 60 * 60, refreshToken);
        await redisClient.setEx(`user:${user.id}:status`, 900, "online");
        console.log('Tokens stored in Redis');
      }

      res.json({ message: "Login successful", accessToken, refreshToken });
    } finally {
      connection.release();
      console.log('Database connection released');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Login error", error });
  }
};


// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const connection = await db.getConnection();

    try {
      const [results] = await connection.execute(
        "SELECT id, otp, otpExpires FROM users WHERE email = ?", 
        [email]
      );

      if (results.length === 0) {
        return res.status(400).json({ message: "Invalid email or OTP" });
      }

      const user = results[0];

      // Check OTP expiration
      if (new Date() > new Date(user.otpExpires)) {
        return res.status(400).json({ message: "OTP expired. Request a new one." });
      }

      // Verify OTP
      if (user.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Mark user as verified
      await connection.execute("UPDATE users SET isVerified = 1, otp = NULL, otpExpires = NULL WHERE id = ?", [user.id]);

      res.json({ message: "Account verified successfully. You can now log in." });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "OTP verification error", error });
  }
};



exports.getUserProfile = async (req, res) => {
  try {
    const [results] = await db.execute("SELECT id, email, username FROM users WHERE id = ?", [req.user.id]);
    if (results.length === 0) return res.status(404).json({ error: "User not found" });
    res.status(200).json(results[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error", details: err.message });
  }
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
  
      if (isRedisAvailable) {
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
  
  
module.exports = { registerUser, verifyUser , loginUser, verifyOtp, getLoggedInUser, logoutUser };

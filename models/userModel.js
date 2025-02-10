const { db } = require('../config/db');

// Create User
const createUser = async (user) => {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO users (firstname, lastname, username, email, password, role, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [user.firstname, user.lastname, user.username, user.email, user.password, user.role, false], (err, results) => {
      if (err) return reject(err);
      resolve(results.insertId);
    });
  });
};

// Find User by Email
const findUserByEmail = async (email) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

// Verify User
const verifyUser = async (userId) => {
  return new Promise((resolve, reject) => {
    const sql = "UPDATE users SET isVerified = 1 WHERE id = ?";
    db.query(sql, [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

module.exports = { createUser, findUserByEmail, verifyUser };

const axios = require("axios");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "your_paystack_secret_key";

// Initialize Paystack payment
const initializePayment = async (req, res) => {
  const { email, amount } = req.body;
  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      { email, amount },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );
    res.json({ success: true, paymentUrl: response.data.data.authorization_url });
  } catch (error) {
    console.error("Paystack initialization error:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Payment initialization failed" });
  }
};

// Verify Paystack payment
const verifyPayment = async (req, res) => {
  const { reference } = req.params;
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );
    res.json({ success: response.data.data.status === "success" });
  } catch (error) {
    console.error("Paystack verification error:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

module.exports = { initializePayment, verifyPayment }
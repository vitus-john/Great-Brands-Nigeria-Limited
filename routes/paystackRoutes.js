const router = require("express").Router();
const paystackService = require("../services/paystackService");


router.post("/initialize", paystackService.initializePayment);
router.get("/verify/:reference", paystackService.verifyPayment);

module.exports = router;

// routes/ticketRoutes.js
const express = require('express');
const ticketController = require('../controllers/bookingController');
const { getLoggedInUser } = require('../controllers/authController');

const router = express.Router();

// Ticket management
router.post('/book', getLoggedInUser, ticketController.bookTicket);
router.post('/cancel', ticketController.cancelTicket);
router.get('/user/:userId', ticketController.viewBookedTickets);
router.delete('/:ticketId', ticketController.deleteBooking);

module.exports = router;
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { isOrganizer } = require('../middleware/authMiddleware');

// Event management
router.post('/initialize', isOrganizer, eventController.initializeEvent);
router.put('/:eventId', isOrganizer, eventController.updateEvent);
router.delete('/:eventId', isOrganizer, eventController.deleteEvent);
router.post('/:eventId/cancel', isOrganizer, eventController.cancelEvent);
router.get('/status/:eventId', eventController.getEventStatus);

// Get event status
router.get('/status/:eventId', eventController.getEventStatus);

module.exports = router;

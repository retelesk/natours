const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession,
);
const router = express.Router();

module.exports = router;

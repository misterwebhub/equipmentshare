const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.post('/refresh',  ctrl.refresh);
router.get('/me',        authenticate, ctrl.me);
router.post('/logout',   authenticate, ctrl.logout);

module.exports = router;

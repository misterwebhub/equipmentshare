const express = require('express');
const router = express.Router();
const { authenticate, orgScope, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/bookings.controller');

router.use(authenticate, orgScope);

router.get('/availability',                                          ctrl.checkAvailability);
router.get('/',                                                       ctrl.list);
router.get('/:id',                                                    ctrl.getById);
router.post('/',       requireRole('admin','manager','operator'),     ctrl.create);
router.put('/:id',     requireRole('admin','manager','operator'),     ctrl.update);
router.patch('/:id/status', requireRole('admin','manager','operator'), ctrl.updateStatus);

module.exports = router;

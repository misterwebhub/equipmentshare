const express = require('express');
const router = express.Router();
const { authenticate, orgScope, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/bookings.controller');

router.use(authenticate, orgScope);

router.get('/availability',                                          ctrl.checkAvailability);
router.get('/',                                                       ctrl.list);
router.get('/:id',                                                    ctrl.getById);
router.post('/',       requireRole('admin','manager','operator'),     ctrl.create);
router.patch('/:id/status',  requireRole('admin','manager','operator'), ctrl.updateStatus);
router.patch('/:id/convert', requireRole('admin','manager','operator'), ctrl.convertQuotation);

module.exports = router;

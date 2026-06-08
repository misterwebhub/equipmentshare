const express = require('express');
const router = express.Router();
const { authenticate, orgScope, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/equipment-units.controller');

router.use(authenticate, orgScope);

router.get('/fleet',     ctrl.fleetView);
router.get('/available', ctrl.availableUnits);
router.put('/:unitId',   requireRole('admin','manager','operator'), ctrl.updateUnit);
router.delete('/:unitId',requireRole('admin','manager'), ctrl.deleteUnit);

module.exports = router;

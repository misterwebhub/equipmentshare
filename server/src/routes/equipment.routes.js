const express = require('express');
const router = express.Router();
const { authenticate, orgScope, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/equipment.controller');

router.use(authenticate, orgScope);

router.get('/',                                              ctrl.list);
router.get('/:id',                                          ctrl.getById);
router.post('/',       requireRole('admin', 'manager'),     ctrl.create);
router.put('/:id',     requireRole('admin', 'manager'),     ctrl.update);
router.delete('/:id',  requireRole('admin', 'manager'),     ctrl.remove);
router.patch('/:id/status', requireRole('admin','manager','operator'), ctrl.updateStatus);
router.get('/:id/history',                                  ctrl.getHistory);

module.exports = router;

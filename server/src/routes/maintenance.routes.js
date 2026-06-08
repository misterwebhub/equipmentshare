const express = require('express');
const router = express.Router();
const { authenticate, orgScope, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/maintenance.controller');

router.use(authenticate, orgScope);

router.get('/',                    ctrl.list);
router.post('/',                   requireRole('admin','manager'), ctrl.create);
router.put('/:id',                 requireRole('admin','manager'), ctrl.update);
router.delete('/:id',              requireRole('admin','manager'), ctrl.remove);
router.patch('/:id/complete',      requireRole('admin','manager','operator'), ctrl.complete);
router.get('/condition-reports',   ctrl.listConditionReports);
router.post('/condition-reports',  requireRole('admin','manager','operator'), ctrl.createConditionReport);

module.exports = router;

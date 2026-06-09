const router = require('express').Router();
const { authenticate, orgScope, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/condition-reports.controller');

router.use(authenticate, orgScope);
router.get('/stats',  ctrl.stats);
router.get('/',       ctrl.list);
router.get('/:id',    ctrl.getById);
router.post('/',      ctrl.create);
router.patch('/:id/status', requireRole('admin','manager','operator'), ctrl.updateStatus);

module.exports = router;

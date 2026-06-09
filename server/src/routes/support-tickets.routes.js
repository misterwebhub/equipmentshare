const router = require('express').Router();
const { authenticate, orgScope, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/support-tickets.controller');

router.use(authenticate, orgScope);
router.get('/stats',      ctrl.stats);
router.get('/',           ctrl.list);
router.get('/:id',        ctrl.getById);
router.post('/',          ctrl.create);
router.patch('/:id',      requireRole('admin','manager'), ctrl.updateStatus);
router.post('/:id/comments', ctrl.addComment);

module.exports = router;

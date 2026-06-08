const express = require('express');
const router = express.Router();
const { authenticate, orgScope, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/users.controller');

router.use(authenticate, orgScope);

router.get('/',                   ctrl.list);
router.post('/invite',            requireRole('admin'), ctrl.invite);
router.put('/:id',                requireRole('admin'), ctrl.update);
router.patch('/:id/deactivate',   requireRole('admin'), ctrl.deactivate);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticate, orgScope, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/categories.controller');

router.use(authenticate, orgScope);

router.get('/',       ctrl.list);
router.post('/',      requireRole('admin','manager'), ctrl.create);
router.put('/:id',    requireRole('admin','manager'), ctrl.update);
router.delete('/:id', requireRole('admin'),           ctrl.remove);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticate, orgScope, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/customers.controller');

router.use(authenticate, orgScope);

router.get('/',        ctrl.list);
router.get('/:id',     ctrl.getById);
router.post('/',       requireRole('admin','manager','operator'), ctrl.create);
router.put('/:id',     requireRole('admin','manager','operator'), ctrl.update);
router.delete('/:id',  requireRole('admin','manager'),            ctrl.remove);

module.exports = router;

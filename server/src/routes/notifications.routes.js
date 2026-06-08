const router = require('express').Router();
const { authenticate, orgScope } = require('../middleware/auth');
const ctrl = require('../controllers/notifications.controller');

router.use(authenticate, orgScope);
router.get('/',        ctrl.list);
router.patch('/read',  ctrl.markRead);
router.post('/',       ctrl.create);
router.delete('/:id',  ctrl.remove);

module.exports = router;

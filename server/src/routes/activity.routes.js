const router = require('express').Router();
const { authenticate, orgScope } = require('../middleware/auth');
const ctrl = require('../controllers/activity.controller');

router.use(authenticate, orgScope);
router.get('/',       ctrl.list);
router.get('/stats',  ctrl.stats);

module.exports = router;

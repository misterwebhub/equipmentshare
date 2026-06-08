const express = require('express');
const router = express.Router();
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/superadmin.controller');

router.use(authenticate, requireSuperAdmin);

router.get('/dashboard',                    ctrl.getDashboard);
router.get('/organisations',                ctrl.listOrganisations);
router.get('/organisations/:id',            ctrl.getOrganisation);
router.patch('/organisations/:id/status',   ctrl.updateOrgStatus);
router.get('/subscriptions',                ctrl.listSubscriptions);
router.post('/subscriptions',               ctrl.createSubscription);
router.put('/subscriptions/:id',            ctrl.updateSubscription);
router.patch('/subscriptions/:id/cancel',   ctrl.cancelSubscription);
router.get('/plans',                        ctrl.listPlans);
router.post('/plans',                       ctrl.createPlan);
router.put('/plans/:id',                    ctrl.updatePlan);

module.exports = router;

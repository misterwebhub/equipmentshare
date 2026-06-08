import { Router } from 'express';
import { list, find, insert, update, remove, nextId } from '../store.js';
import { authenticate, tenantScope } from '../auth.js';

/**
 * Builds a standard tenant-scoped CRUD router for a collection.
 *   GET    /            list (filtered to caller's org)
 *   GET    /:id         read one
 *   POST   /            create (orgId injected from caller)
 *   PUT    /:id         update
 *   DELETE /:id         delete
 *
 * @param {string} collection store key
 * @param {string} idPrefix   id prefix for new rows, e.g. 'equip'
 */
export function crudRouter(collection, idPrefix) {
  const router = Router();
  router.use(authenticate);

  router.get('/', (req, res) => {
    res.json(list(collection, tenantScope(req)));
  });

  router.get('/:id', (req, res) => {
    const row = find(collection, req.params.id, tenantScope(req));
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });

  router.post('/', (req, res) => {
    const scope = tenantScope(req);
    // Super admin must target an org via ?orgId or body.orgId.
    const orgId = req.user.role === 'superadmin' ? req.body.orgId || scope : req.user.orgId;
    if (!orgId) return res.status(400).json({ error: 'orgId is required' });
    const row = insert(collection, {
      ...req.body,
      id: nextId(idPrefix),
      orgId,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json(row);
  });

  router.put('/:id', (req, res) => {
    const { id: _i, orgId: _o, createdAt: _c, ...patch } = req.body || {};
    const row = update(collection, req.params.id, patch, tenantScope(req));
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });

  router.delete('/:id', (req, res) => {
    const ok = remove(collection, req.params.id, tenantScope(req));
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  });

  return router;
}

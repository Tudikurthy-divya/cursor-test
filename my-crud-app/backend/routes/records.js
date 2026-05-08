const express = require('express');
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  const { title, description, category, priority } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO records (user_id, title, description, category, priority)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, title, description, category, priority, created_at, updated_at`,
      [req.user.id, title.trim(), description ?? null, category ?? null, priority ?? null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, title, description, category, priority, created_at, updated_at
       FROM records WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, category, priority } = req.body || {};
  const sets = [];
  const vals = [];
  let n = 1;
  if (title !== undefined) {
    sets.push(`title = $${n++}`);
    vals.push(title);
  }
  if (description !== undefined) {
    sets.push(`description = $${n++}`);
    vals.push(description);
  }
  if (category !== undefined) {
    sets.push(`category = $${n++}`);
    vals.push(category);
  }
  if (priority !== undefined) {
    sets.push(`priority = $${n++}`);
    vals.push(priority);
  }
  if (sets.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  const idPlaceholder = n++;
  const userPlaceholder = n;
  vals.push(id, req.user.id);
  try {
    const result = await pool.query(
      `UPDATE records SET ${sets.join(', ')}
       WHERE id = $${idPlaceholder} AND user_id = $${userPlaceholder}
       RETURNING id, user_id, title, description, category, priority, created_at, updated_at`,
      vals
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM records WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

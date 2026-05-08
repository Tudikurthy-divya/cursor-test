const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function toPublicUser(row) {
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    provider: row.provider,
    created_at: row.created_at,
  };
}

router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, provider)
       VALUES ($1, $2, $3, $4, 'email')
       RETURNING id, first_name, last_name, email, provider, created_at`,
      [firstName || null, lastName || null, email.toLowerCase(), password_hash]
    );
    const user = result.rows[0];
    const token = signToken(user);
    return res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, password_hash, provider, created_at FROM users WHERE email = $1',
      [String(email).toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const row = result.rows[0];
    if (!row.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = toPublicUser(row);
    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/google', async (req, res) => {
  const { credential } = req.body || {};
  if (!credential || typeof credential !== 'string') {
    return res.status(400).json({ error: 'credential (access token) required' });
  }
  try {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${credential}` },
      timeout: 10000,
    });
    if (!data.email) {
      return res.status(400).json({ error: 'Google did not return email' });
    }
    const email = String(data.email).toLowerCase();
    const first_name = data.given_name || data.name || null;
    const last_name = data.family_name || null;

    const existing = await pool.query(
      'SELECT id, first_name, last_name, email, provider, created_at FROM users WHERE email = $1',
      [email]
    );

    let userRow;
    if (existing.rows.length > 0) {
      const updated = await pool.query(
        `UPDATE users SET first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name), provider = 'google'
         WHERE email = $1
         RETURNING id, first_name, last_name, email, provider, created_at`,
        [email, first_name, last_name]
      );
      userRow = updated.rows[0];
    } else {
      const inserted = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, provider)
         VALUES ($1, $2, $3, NULL, 'google')
         RETURNING id, first_name, last_name, email, provider, created_at`,
        [first_name, last_name, email]
      );
      userRow = inserted.rows[0];
    }

    const user = toPublicUser(userRow);
    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    if (err.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, provider, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.json({ user: toPublicUser(result.rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

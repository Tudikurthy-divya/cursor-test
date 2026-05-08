require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name TEXT,
        last_name TEXT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        provider TEXT NOT NULL DEFAULT 'email',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        priority TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);'
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_records_user_id ON records (user_id);'
    );

    await client.query(`
      CREATE OR REPLACE FUNCTION set_records_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at := NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query('DROP TRIGGER IF EXISTS trg_records_updated_at ON records;');
    await client.query(`
      CREATE TRIGGER trg_records_updated_at
      BEFORE UPDATE ON records
      FOR EACH ROW
      EXECUTE PROCEDURE set_records_updated_at();
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  try {
    console.log('🚀 Running database migration...');
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();

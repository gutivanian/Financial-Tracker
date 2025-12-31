// Script untuk check user di database
// Run: node scripts/check-user.js

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

// Database configuration
const sslConfig = process.env.DB_SSL === 'true' && process.env.DB_CA_PATH
  ? {
      rejectUnauthorized: true,
      ca: fs.readFileSync(process.env.DB_CA_PATH).toString(),
    }
  : false;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'personal_finance',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: sslConfig,
});

async function checkUser() {
  try {
    console.log('🔍 Checking database connection...\n');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected!\n');
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table "users" tidak ditemukan!');
      console.log('   Jalankan: psql -d personal-finance -f database/schema.sql\n');
      process.exit(1);
    }
    
    console.log('✅ Table "users" ditemukan\n');
    
    // Check if password_hash column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password_hash';
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ Kolom "password_hash" tidak ditemukan!');
      console.log('   Jalankan: psql -d personal-finance -f database/add_password_migration.sql\n');
      process.exit(1);
    }
    
    console.log('✅ Kolom "password_hash" ditemukan\n');
    
    // Check demo user
    const userCheck = await pool.query(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      ['demo@finance.com']
    );
    
    if (userCheck.rows.length === 0) {
      console.log('❌ User "demo@finance.com" tidak ditemukan!\n');
      console.log('Jalankan query ini untuk membuat user:');
      console.log('');
      console.log('   node scripts/generate-hash.js');
      console.log('');
      console.log('Kemudian jalankan SQL INSERT yang dihasilkan.\n');
      process.exit(1);
    }
    
    const user = userCheck.rows[0];
    console.log('✅ User ditemukan:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Password Hash:', user.password_hash ? '✅ Ada' : '❌ Kosong');
    
    if (!user.password_hash) {
      console.log('\n❌ Password hash kosong!');
      console.log('   Jalankan: node scripts/generate-hash.js');
      console.log('   Kemudian jalankan SQL UPDATE yang dihasilkan.\n');
      process.exit(1);
    }
    
    console.log('\n✅ Setup database sudah benar!');
    console.log('   Coba login dengan:');
    console.log('   Email: demo@finance.com');
    console.log('   Password: demo123\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nCheck .env file Anda. Contoh:');
    console.error('DB_USER=your_user');
    console.error('DB_HOST=localhost');
    console.error('DB_NAME=personal-finance');
    console.error('DB_PASSWORD=your_password');
    console.error('DB_PORT=5432\n');
  } finally {
    await pool.end();
  }
}

checkUser();

// Test database connection and user setup
// Run with: node scripts/test-db.js

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

async function testDatabase() {
  console.log('🔍 Testing Database Connection...\n');

  // Database configuration
  const sslConfig = process.env.DB_SSL === 'true' && process.env.DB_CA_PATH
    ? {
        rejectUnauthorized: true,
        ca: fs.readFileSync(process.env.DB_CA_PATH).toString(),
      }
    : false;

  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: sslConfig,
  });

  try {
    // Test 1: Basic connection
    console.log('Test 1: Basic Connection');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully!');
    console.log('   Server time:', result.rows[0].now);
    console.log('');

    // Test 2: Check if users table exists
    console.log('Test 2: Users Table');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Users table exists');
    } else {
      console.log('❌ Users table not found!');
      console.log('   Run: psql -d personal-finance -f database/schema.sql');
      return;
    }
    console.log('');

    // Test 3: Check password_hash column
    console.log('Test 3: Password Hash Column');
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'password_hash';
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ password_hash column exists');
    } else {
      console.log('❌ password_hash column not found!');
      console.log('   Run: psql -d personal-finance -f database/add_password_migration.sql');
      return;
    }
    console.log('');

    // Test 4: Check demo user
    console.log('Test 4: Demo User');
    const userCheck = await pool.query(`
      SELECT id, email, name, 
             CASE 
               WHEN password_hash IS NULL THEN 'NULL' 
               WHEN password_hash = '' THEN 'EMPTY'
               ELSE 'SET' 
             END as password_status
      FROM users 
      WHERE email = 'demo@finance.com';
    `);
    
    if (userCheck.rows.length === 0) {
      console.log('❌ Demo user not found!');
      console.log('   Create user:');
      console.log(`   INSERT INTO users (email, name, password_hash) VALUES 
                ('demo@finance.com', 'Demo User', 
                '$2a$10$5jH3vP9K5mQ9yY7fD6xNJO3Z7KvL8qR9mN5oP6wX7gH9iJ2kL8mN4');`);
    } else {
      const user = userCheck.rows[0];
      console.log('✅ Demo user found');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Name:', user.name);
      console.log('   Password:', user.password_status);
      
      if (user.password_status !== 'SET') {
        console.log('');
        console.log('⚠️  Password not set! Update with:');
        console.log(`   UPDATE users SET password_hash = '$2a$10$5jH3vP9K5mQ9yY7fD6xNJO3Z7KvL8qR9mN5oP6wX7gH9iJ2kL8mN4' WHERE email = 'demo@finance.com';`);
      }
    }
    console.log('');

    // Test 5: JWT Secret
    console.log('Test 5: JWT Secret');
    if (process.env.JWT_SECRET) {
      const length = process.env.JWT_SECRET.length;
      console.log('✅ JWT_SECRET is set');
      console.log('   Length:', length, 'characters');
      
      if (length < 32) {
        console.log('   ⚠️  Recommendation: Use at least 32 characters for security');
      }
    } else {
      console.log('❌ JWT_SECRET not set in .env!');
      console.log('   Add to .env: JWT_SECRET=your-secret-key-here');
    }
    console.log('');

    console.log('✨ All tests completed!\n');
    console.log('📝 Summary:');
    console.log('   - Database connection: OK');
    console.log('   - Users table: OK');
    console.log('   - Password column: OK');
    console.log('   - Demo user:', userCheck.rows.length > 0 ? 'OK' : 'NOT FOUND');
    console.log('   - JWT Secret:', process.env.JWT_SECRET ? 'OK' : 'NOT SET');
    console.log('');
    console.log('🚀 You can now run: npm run dev');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check your .env file');
    console.error('2. Make sure PostgreSQL is running');
    console.error('3. Verify database credentials');
    console.error('4. Check database exists: createdb personal-finance');
  } finally {
    await pool.end();
  }
}

testDatabase();

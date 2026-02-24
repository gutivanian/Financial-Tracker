// Script untuk menjalankan migration add sso_user_id
const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: true,
    ca: process.env.DB_CA_CERT
  } : false
};

async function runMigration() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');
    
    console.log('\n📄 Reading migration file...');
    const migrationSQL = fs.readFileSync('./migration-add-sso.sql', 'utf8');
    
    console.log('🚀 Running migration...');
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify
    console.log('\n🔍 Verifying users table structure...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 Users table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check existing users
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n👥 Total users: ${usersResult.rows[0].count}`);
    
    const noSSOResult = await client.query('SELECT COUNT(*) as count FROM users WHERE sso_user_id IS NULL');
    console.log(`⚠️  Users without sso_user_id: ${noSSOResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

console.log('='.repeat(50));
console.log('🔧 PFTU Database Migration - Add SSO User ID');
console.log('='.repeat(50));
runMigration();

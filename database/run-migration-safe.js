// Script aman untuk menjalankan migration add sso_user_id
// Akan check kondisi existing dan skip step yang sudah ada
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

async function columnExists(client, tableName, columnName) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = $2
    )
  `, [tableName, columnName]);
  return result.rows[0].exists;
}

async function tableExists(client, tableName) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_name = $1
    )
  `, [tableName]);
  return result.rows[0].exists;
}

async function runMigration() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');
    
    // Check if sso_user_id column already exists
    const hasSSO = await columnExists(client, 'users', 'sso_user_id');
    
    if (hasSSO) {
      console.log('\n✅ Column sso_user_id already exists!');
      
      // Verify structure
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
      
      console.log('\n✨ No migration needed. Database already configured for SSO!');
      return;
    }
    
    console.log('\n📝 Starting migration...\n');
    
    // Step 1: Backup (skip if already exists)
    const hasBackup = await tableExists(client, 'users_backup');
    if (hasBackup) {
      console.log('⏭️  Step 1: Backup already exists, skipping...');
    } else {
      console.log('💾 Step 1: Creating backup...');
      await client.query('CREATE TABLE users_backup AS SELECT * FROM users');
      console.log('✅ Backup created!');
    }
    
    // Step 2: Add sso_user_id column
    console.log('➕ Step 2: Adding sso_user_id column...');
    await client.query('ALTER TABLE users ADD COLUMN sso_user_id UUID');
    console.log('✅ Column added!');
    
    // Step 3: Create unique index
    console.log('🔍 Step 3: Creating unique index...');
    await client.query(`
      CREATE UNIQUE INDEX idx_users_sso_user_id_unique 
      ON users(sso_user_id) 
      WHERE sso_user_id IS NOT NULL
    `);
    console.log('✅ Index created!');
    
    // Step 4: Generate UUIDs for existing users
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log(`🔑 Step 4: Generating UUIDs for ${userCount.rows[0].count} existing user(s)...`);
      await client.query('UPDATE users SET sso_user_id = gen_random_uuid() WHERE sso_user_id IS NULL');
      console.log('✅ UUIDs generated!');
    } else {
      console.log('⏭️  Step 4: No existing users, skipping UUID generation...');
    }
    
    console.log('\n✨ Migration completed successfully!');
    
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
    
    // Check users status
    const totalUsers = await client.query('SELECT COUNT(*) as count FROM users');
    const withSSO = await client.query('SELECT COUNT(*) as count FROM users WHERE sso_user_id IS NOT NULL');
    console.log(`\n👥 Total users: ${totalUsers.rows[0].count}`);
    console.log(`✅ Users with sso_user_id: ${withSSO.rows[0].count}`);
    
    console.log('\n💡 Next steps:');
    console.log('  1. Restart your PFTU server');
    console.log('  2. Test SSO login from PFTU to SSO-Auth');
    console.log('  3. New SSO logins will automatically create users with sso_user_id');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

console.log('='.repeat(60));
console.log('🔧 PFTU Database Migration - Add SSO User ID (Safe Mode)');
console.log('='.repeat(60));
runMigration();

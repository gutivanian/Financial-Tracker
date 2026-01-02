// Script to run migration: Add to_account_id and admin_fee columns
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false,
    ca: process.env.DB_CA_CERT
  } : false,
});

async function runMigration() {
  console.log('🔧 Starting Migration: Add Transfer Feature Columns');
  console.log('═'.repeat(60));
  
  try {
    // 1. Add to_account_id column
    console.log('\n1️⃣  Adding to_account_id column...');
    await pool.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'transactions' 
              AND column_name = 'to_account_id'
          ) THEN
              ALTER TABLE transactions 
              ADD COLUMN to_account_id INTEGER;
              
              ALTER TABLE transactions
              ADD CONSTRAINT fk_to_account 
                  FOREIGN KEY (to_account_id) 
                  REFERENCES accounts(id) 
                  ON DELETE SET NULL;
              
              RAISE NOTICE 'Column to_account_id added successfully';
          ELSE
              RAISE NOTICE 'Column to_account_id already exists';
          END IF;
      END $$;
    `);
    console.log('   ✅ to_account_id column ready');
    
    // 2. Add admin_fee column
    console.log('\n2️⃣  Adding admin_fee column...');
    await pool.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'transactions' 
              AND column_name = 'admin_fee'
          ) THEN
              ALTER TABLE transactions 
              ADD COLUMN admin_fee NUMERIC(15, 2) DEFAULT 0;
              
              RAISE NOTICE 'Column admin_fee added successfully';
          ELSE
              RAISE NOTICE 'Column admin_fee already exists';
          END IF;
      END $$;
    `);
    console.log('   ✅ admin_fee column ready');
    
    // 3. Add indexes
    console.log('\n3️⃣  Adding indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_to_account_id 
          ON transactions(to_account_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_type 
          ON transactions(type);
    `);
    console.log('   ✅ Indexes created');
    
    // 4. Add Admin Fee category for all users
    console.log('\n4️⃣  Ensuring Admin Fee category exists for all users...');
    const result = await pool.query(`
      INSERT INTO categories (user_id, name, type, parent_id, icon, color, budget_type, is_active, created_at)
      SELECT 
          u.id as user_id,
          'Admin Fee' as name,
          'expense' as type,
          NULL as parent_id,
          'DollarSign' as icon,
          '#ef4444' as color,
          'needs' as budget_type,
          true as is_active,
          CURRENT_TIMESTAMP as created_at
      FROM users u
      WHERE NOT EXISTS (
          SELECT 1 
          FROM categories c 
          WHERE c.user_id = u.id 
          AND c.name = 'Admin Fee' 
          AND c.type = 'expense'
      )
      RETURNING user_id, id, name;
    `);
    
    if (result.rows.length > 0) {
      console.log(`   ✅ Created Admin Fee category for ${result.rows.length} user(s)`);
      result.rows.forEach(row => {
        console.log(`      - User ID ${row.user_id}: Category ID ${row.id}`);
      });
    } else {
      console.log('   ℹ️  Admin Fee category already exists for all users');
    }
    
    // 5. Verify migration
    console.log('\n5️⃣  Verifying migration...');
    const verifyResult = await pool.query(`
      SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
      FROM information_schema.columns
      WHERE table_name = 'transactions'
      AND column_name IN ('to_account_id', 'admin_fee')
      ORDER BY column_name;
    `);
    
    console.log('   ✅ Verification results:');
    verifyResult.rows.forEach(row => {
      console.log(`      - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // 6. Check Admin Fee categories
    const categoryCount = await pool.query(`
      SELECT 
          u.id as user_id,
          u.email,
          c.id as category_id,
          c.name as category_name
      FROM users u
      LEFT JOIN categories c ON c.user_id = u.id AND c.name = 'Admin Fee'
      ORDER BY u.id;
    `);
    
    console.log(`\n   📊 Admin Fee categories per user:`);
    categoryCount.rows.forEach(row => {
      const status = row.category_id ? '✅' : '❌';
      console.log(`      ${status} User ${row.user_id} (${row.email}): ${row.category_id ? 'ID ' + row.category_id : 'NOT FOUND'}`);
    });
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

// Script untuk membuat user baru di database
// Run dengan: node scripts/create-user.js

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

// Setup database connection
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

async function createUser(email, name, password) {
  try {
    // 1. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('\n📝 Creating new user...');
    console.log('Email:', email);
    console.log('Name:', name);
    
    // 2. Check if user already exists
    const checkResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('\n❌ Error: User dengan email ini sudah ada!');
      console.log('Existing user:', checkResult.rows[0]);
      return;
    }
    
    // 3. Insert new user
    const result = await pool.query(
      'INSERT INTO users (email, name, password_hash, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, email, name, created_at',
      [email, name, passwordHash]
    );
    
    const newUser = result.rows[0];
    
    console.log('\n✅ User berhasil dibuat!');
    console.log('ID:', newUser.id);
    console.log('Email:', newUser.email);
    console.log('Name:', newUser.name);
    console.log('Created:', newUser.created_at);
    console.log('\n🔑 Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('\n❌ Error creating user:', error.message);
  } finally {
    await pool.end();
  }
}

// Ambil arguments dari command line atau gunakan interactive input
const args = process.argv.slice(2);

if (args.length >= 3) {
  // Mode: node scripts/create-user.js email name password
  const [email, name, password] = args;
  createUser(email, name, password);
} else {
  // Interactive mode
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('🧑 Create New User');
  console.log('=================\n');
  
  rl.question('Email: ', (email) => {
    rl.question('Name: ', (name) => {
      rl.question('Password: ', (password) => {
        rl.close();
        createUser(email, name, password);
      });
    });
  });
}

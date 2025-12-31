// Script untuk generate password hash yang benar
// Run: node scripts/generate-hash.js

const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'demo123';
  const saltRounds = 10;
  
  console.log('Generating password hash...\n');
  
  const hash = await bcrypt.hash(password, saltRounds);
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\n=== Copy SQL berikut untuk update database ===\n');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'demo@finance.com';`);
  console.log('\n=== Atau jika user belum ada ===\n');
  console.log(`INSERT INTO users (email, name, password_hash) VALUES ('demo@finance.com', 'Demo User', '${hash}');`);
  
  // Verify hash works
  console.log('\n=== Verifying hash ===');
  const isValid = await bcrypt.compare(password, hash);
  console.log('Hash verification:', isValid ? '✅ VALID' : '❌ INVALID');
}

generateHash().catch(console.error);

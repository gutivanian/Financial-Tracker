// Script untuk generate password hash
// Run dengan: node scripts/generate-password.js

const bcrypt = require('bcryptjs');

async function generatePasswordHash() {
  const password = 'demo123';
  const saltRounds = 10;
  
  const hash = await bcrypt.hash(password, saltRounds);
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nGunakan hash ini untuk update database:');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'demo@finance.com';`);
}

generatePasswordHash();

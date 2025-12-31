// Test login API
// Run with: node scripts/test-login.js

const bcrypt = require('bcryptjs');

async function testLogin() {
  console.log('🔐 Testing Login API\n');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // Test credentials
  const credentials = {
    email: 'demo@finance.com',
    password: 'demo123'
  };

  console.log('Testing with:');
  console.log('  Email:', credentials.email);
  console.log('  Password:', credentials.password);
  console.log('  API URL:', API_URL);
  console.log('');

  try {
    console.log('Sending login request...');
    
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('Response status:', response.status, response.statusText);
    console.log('');

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Login successful!\n');
      console.log('Token:', data.token?.substring(0, 50) + '...');
      console.log('');
      console.log('User info:');
      console.log('  ID:', data.user.id);
      console.log('  Email:', data.user.email);
      console.log('  Name:', data.user.name);
      console.log('');
      console.log('🎉 Authentication is working correctly!');

      // Test verify endpoint
      console.log('');
      console.log('Testing verify endpoint...');
      const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${data.token}`,
        },
      });

      console.log('Verify status:', verifyResponse.status, verifyResponse.statusText);
      
      const verifyData = await verifyResponse.json();
      
      if (verifyResponse.ok) {
        console.log('✅ Token verification successful!');
        console.log('  User:', verifyData.user.name);
      } else {
        console.log('❌ Token verification failed:', verifyData.error);
      }

    } else {
      console.log('❌ Login failed!\n');
      console.log('Error:', data.error || 'Unknown error');
      console.log('');
      console.log('Troubleshooting:');
      console.log('1. Check if server is running (npm run dev)');
      console.log('2. Verify database connection');
      console.log('3. Run: node scripts/test-db.js');
      console.log('4. Check password hash in database');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Make sure:');
    console.error('1. Development server is running (npm run dev)');
    console.error('2. API URL is correct:', API_URL);
    console.error('3. No network/firewall issues');
  }
}

// Test password hashing
async function testPasswordHash() {
  console.log('\n📝 Password Hash Test\n');
  
  const password = 'demo123';
  const storedHash = '$2a$10$5jH3vP9K5mQ9yY7fD6xNJO3Z7KvL8qR9mN5oP6wX7gH9iJ2kL8mN4';
  
  console.log('Testing password:', password);
  console.log('Against hash:', storedHash.substring(0, 30) + '...');
  console.log('');
  
  const isValid = await bcrypt.compare(password, storedHash);
  
  if (isValid) {
    console.log('✅ Password matches hash');
  } else {
    console.log('❌ Password does not match hash');
    console.log('');
    console.log('This hash is for password: demo123');
    console.log('If you changed the password, generate new hash with:');
    console.log('  node scripts/generate-password.js');
  }
}

// Run tests
async function runTests() {
  await testPasswordHash();
  console.log('\n' + '='.repeat(60) + '\n');
  await testLogin();
}

runTests();

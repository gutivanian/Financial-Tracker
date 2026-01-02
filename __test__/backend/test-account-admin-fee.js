/**
 * Backend Test: Account Creation with Auto Admin Fee Category
 * 
 * Test untuk memastikan:
 * 1. Saat membuat account baru, Admin Fee category otomatis dibuat
 * 2. Admin Fee category tidak duplikat jika sudah ada
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';
let authToken = '';

const testConfig = {
  email: 'demo@finance.com',
  password: 'demo123'
};

function logTest(testName, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status}: ${testName}`);
  if (message) console.log(`   ${message}`);
}

async function apiCall(method, endpoint, data = null) {
  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) config.data = data;
  
  return axios(config);
}

async function testLogin() {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: testConfig.email,
      password: testConfig.password
    });
    
    if (response.data.token) {
      authToken = response.data.token;
      logTest('Login', true, 'Successfully obtained auth token');
      return true;
    }
    
    logTest('Login', false, 'No token received');
    return false;
  } catch (error) {
    logTest('Login', false, error.message);
    return false;
  }
}

async function countAdminFeeCategories() {
  try {
    const response = await apiCall('GET', '/api/categories');
    const categories = response.data.all || [];
    
    const adminFeeCategories = categories.filter(c => 
      c.name === 'Admin Fee' && c.type === 'expense'
    );
    
    return adminFeeCategories.length;
  } catch (error) {
    return -1;
  }
}

async function testCreateAccountWithAdminFeeCategory() {
  try {
    // Count admin fee categories before creating account
    const beforeCount = await countAdminFeeCategories();
    
    if (beforeCount < 0) {
      logTest('Create Account with Admin Fee Category', false, 'Failed to count existing categories');
      return null;
    }
    
    // Create new account
    const randomName = `Test Account ${Date.now()}`;
    const response = await apiCall('POST', '/api/accounts', {
      name: randomName,
      type: 'cash',
      balance: 100000,
      currency: 'IDR',
      icon: 'Wallet',
      color: '#10b981'
    });
    
    if (response.status === 201) {
      const newAccount = response.data;
      
      // Count admin fee categories after creating account
      const afterCount = await countAdminFeeCategories();
      
      // Admin Fee category should exist (at least 1)
      if (afterCount >= 1) {
        // If it was 0 before, it should be 1 now. If it was 1 before, should still be 1
        const isCorrect = (beforeCount === 0 && afterCount === 1) || (beforeCount >= 1 && afterCount === beforeCount);
        
        if (isCorrect) {
          logTest('Create Account with Admin Fee Category', true, 
            `Admin Fee categories: ${beforeCount} → ${afterCount}. Account: ${newAccount.name}`);
          return newAccount.id;
        } else {
          logTest('Create Account with Admin Fee Category', false, 
            `Unexpected category count. Before: ${beforeCount}, After: ${afterCount}`);
        }
      } else {
        logTest('Create Account with Admin Fee Category', false, 'Admin Fee category not found after account creation');
      }
    }
    
    return null;
  } catch (error) {
    logTest('Create Account with Admin Fee Category', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testAdminFeeCategoryProperties() {
  try {
    const response = await apiCall('GET', '/api/categories');
    const categories = response.data.all || [];
    
    const adminFeeCategory = categories.find(c => 
      c.name === 'Admin Fee' && c.type === 'expense'
    );
    
    if (!adminFeeCategory) {
      logTest('Admin Fee Category Properties', false, 'Category not found');
      return false;
    }
    
    // Verify properties
    const correctIcon = adminFeeCategory.icon === 'DollarSign';
    const correctColor = adminFeeCategory.color === '#ef4444';
    const correctBudgetType = adminFeeCategory.budget_type === 'needs';
    const isActive = adminFeeCategory.is_active === true;
    
    if (correctIcon && correctColor && correctBudgetType && isActive) {
      logTest('Admin Fee Category Properties', true, 
        `Icon: ${adminFeeCategory.icon}, Color: ${adminFeeCategory.color}, Budget Type: ${adminFeeCategory.budget_type}, Active: ${isActive}`);
      return true;
    } else {
      logTest('Admin Fee Category Properties', false, 
        `Incorrect properties. Icon: ${adminFeeCategory.icon}, Color: ${adminFeeCategory.color}, Budget Type: ${adminFeeCategory.budget_type}`);
    }
    
    return false;
  } catch (error) {
    logTest('Admin Fee Category Properties', false, error.message);
    return false;
  }
}

async function testMultipleAccountCreations() {
  try {
    const beforeCount = await countAdminFeeCategories();
    
    // Create 3 accounts in succession
    for (let i = 1; i <= 3; i++) {
      await apiCall('POST', '/api/accounts', {
        name: `Multi Test Account ${i} ${Date.now()}`,
        type: 'cash',
        balance: 1000 * i,
        currency: 'IDR'
      });
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const afterCount = await countAdminFeeCategories();
    
    // Should still have only 1 Admin Fee category (no duplicates)
    if (afterCount === beforeCount && afterCount === 1) {
      logTest('Multiple Account Creations (No Duplicates)', true, 
        `Created 3 accounts, Admin Fee category count remained at ${afterCount}`);
      return true;
    } else if (afterCount === 1) {
      logTest('Multiple Account Creations (No Duplicates)', true, 
        `Admin Fee category count: ${beforeCount} → ${afterCount}`);
      return true;
    } else {
      logTest('Multiple Account Creations (No Duplicates)', false, 
        `Admin Fee category duplicated. Before: ${beforeCount}, After: ${afterCount}`);
    }
    
    return false;
  } catch (error) {
    logTest('Multiple Account Creations (No Duplicates)', false, error.message);
    return false;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('BACKEND TEST: Account Creation with Admin Fee Category');
  console.log('='.repeat(60));
  
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }
  
  // Test 1: Create account and verify Admin Fee category
  await testCreateAccountWithAdminFeeCategory();
  
  // Test 2: Verify Admin Fee category properties
  await testAdminFeeCategoryProperties();
  
  // Test 3: Multiple account creations (no duplicates)
  await testMultipleAccountCreations();
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETED');
  console.log('='.repeat(60));
}

runTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  process.exit(1);
});

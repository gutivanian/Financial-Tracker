/**
 * Backend Test: Transfer Transaction with Admin Fee (Test User)
 * Testing dengan user: test@finance.com
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';
let authToken = '';
let userId = null;

// Test configuration
const testConfig = {
  email: 'test@finance.com',
  password: 'test123'
};

// Helper function to log test results
function logTest(testName, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status}: ${testName}`);
  if (message) console.log(`   ${message}`);
}

// Helper function to make authenticated API calls
async function apiCall(method, endpoint, data = null) {
  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  try {
    return await axios(config);
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error.response?.data || error.message);
    throw error;
  }
}

// Test 1: Login
async function testLogin() {
  try {
    console.log('\n🔐 Attempting login...');
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: testConfig.email,
      password: testConfig.password
    });
    
    if (response.data.token) {
      authToken = response.data.token;
      userId = response.data.user?.id || response.data.userId;
      logTest('Login', true, `User ID: ${userId}, Token obtained`);
      return true;
    }
    
    logTest('Login', false, 'No token received');
    return false;
  } catch (error) {
    logTest('Login', false, error.response?.data?.message || error.message);
    console.error('Full error:', error.response?.data);
    return false;
  }
}

// Test 2: Check/Create Accounts
async function ensureAccounts() {
  try {
    const response = await apiCall('GET', '/api/accounts');
    let accounts = response.data;
    
    console.log(`\n📊 Found ${accounts.length} existing accounts`);
    
    // If less than 2 accounts, create them
    if (accounts.length < 2) {
      console.log('Creating test accounts...');
      
      // Create Account 1
      const acc1 = await apiCall('POST', '/api/accounts', {
        name: 'Test BCA',
        type: 'bank',
        balance: 5000000,
        currency: 'IDR',
        icon: 'Building2',
        color: '#1a80b0'
      });
      console.log('✓ Created Test BCA:', acc1.data.id);
      
      // Create Account 2
      const acc2 = await apiCall('POST', '/api/accounts', {
        name: 'Test Mandiri',
        type: 'bank',
        balance: 3000000,
        currency: 'IDR',
        icon: 'Building2',
        color: '#f59e0b'
      });
      console.log('✓ Created Test Mandiri:', acc2.data.id);
      
      // Refresh accounts list
      const refreshResponse = await apiCall('GET', '/api/accounts');
      accounts = refreshResponse.data;
    }
    
    if (accounts.length >= 2) {
      logTest('Check/Create Accounts', true, `Using accounts: ${accounts[0].name} & ${accounts[1].name}`);
      return accounts;
    }
    
    logTest('Check/Create Accounts', false, 'Could not ensure 2 accounts exist');
    return null;
  } catch (error) {
    logTest('Check/Create Accounts', false, error.message);
    return null;
  }
}

// Test 3: Check Admin Fee Category
async function checkAdminFeeCategory() {
  try {
    const response = await apiCall('GET', '/api/categories');
    const categories = response.data.all || [];
    
    const adminFeeCategory = categories.find(c => 
      c.name === 'Admin Fee' && c.type === 'expense'
    );
    
    if (adminFeeCategory) {
      logTest('Admin Fee Category Exists', true, 
        `ID: ${adminFeeCategory.id}, Budget Type: ${adminFeeCategory.budget_type}`);
      return adminFeeCategory;
    }
    
    logTest('Admin Fee Category Exists', false, 'Admin Fee category not found');
    console.log('Available categories:', categories.map(c => c.name).join(', '));
    return null;
  } catch (error) {
    logTest('Admin Fee Category Exists', false, error.message);
    return null;
  }
}

// Test 4: Create Transfer WITHOUT Admin Fee
async function testTransferWithoutAdminFee(fromAccount, toAccount) {
  try {
    console.log(`\n💸 Testing Transfer WITHOUT Admin Fee`);
    console.log(`   From: ${fromAccount.name} (Balance: ${fromAccount.balance})`);
    console.log(`   To: ${toAccount.name} (Balance: ${toAccount.balance})`);
    
    // Get current balances
    const accountsResponse = await apiCall('GET', '/api/accounts');
    const accounts = accountsResponse.data;
    const currentFromAccount = accounts.find(a => a.id === fromAccount.id);
    const currentToAccount = accounts.find(a => a.id === toAccount.id);
    
    const initialFromBalance = parseFloat(currentFromAccount.balance);
    const initialToBalance = parseFloat(currentToAccount.balance);
    const transferAmount = 50000;
    
    console.log(`   Initial - From: ${initialFromBalance}, To: ${initialToBalance}`);
    console.log(`   Transfer Amount: ${transferAmount}`);
    
    // Create transfer
    const response = await apiCall('POST', '/api/transactions', {
      type: 'transfer',
      account_id: fromAccount.id,
      to_account_id: toAccount.id,
      amount: transferAmount,
      date: new Date().toISOString().split('T')[0],
      description: 'Test transfer without admin fee',
      admin_fee: 0
    });
    
    console.log(`   ✓ Transaction created: ID ${response.data.id}`);
    
    // Verify balances
    const updatedAccountsResponse = await apiCall('GET', '/api/accounts');
    const updatedAccounts = updatedAccountsResponse.data;
    const updatedFromAccount = updatedAccounts.find(a => a.id === fromAccount.id);
    const updatedToAccount = updatedAccounts.find(a => a.id === toAccount.id);
    
    const expectedFromBalance = initialFromBalance - transferAmount;
    const expectedToBalance = initialToBalance + transferAmount;
    
    const actualFromBalance = parseFloat(updatedFromAccount.balance);
    const actualToBalance = parseFloat(updatedToAccount.balance);
    
    console.log(`   Expected - From: ${expectedFromBalance}, To: ${expectedToBalance}`);
    console.log(`   Actual - From: ${actualFromBalance}, To: ${actualToBalance}`);
    
    const fromBalanceCorrect = Math.abs(actualFromBalance - expectedFromBalance) < 0.01;
    const toBalanceCorrect = Math.abs(actualToBalance - expectedToBalance) < 0.01;
    
    if (fromBalanceCorrect && toBalanceCorrect) {
      logTest('Transfer WITHOUT Admin Fee', true, 
        `✓ Balances updated correctly`);
      return response.data.id;
    } else {
      logTest('Transfer WITHOUT Admin Fee', false, 
        `❌ Balance mismatch! From diff: ${actualFromBalance - expectedFromBalance}, To diff: ${actualToBalance - expectedToBalance}`);
      return null;
    }
  } catch (error) {
    logTest('Transfer WITHOUT Admin Fee', false, error.response?.data?.message || error.message);
    console.error('   Error details:', error.response?.data);
    return null;
  }
}

// Test 5: Create Transfer WITH Admin Fee
async function testTransferWithAdminFee(fromAccount, toAccount) {
  try {
    console.log(`\n💸 Testing Transfer WITH Admin Fee`);
    
    // Get current balances
    const accountsResponse = await apiCall('GET', '/api/accounts');
    const accounts = accountsResponse.data;
    const currentFromAccount = accounts.find(a => a.id === fromAccount.id);
    const currentToAccount = accounts.find(a => a.id === toAccount.id);
    
    const initialFromBalance = parseFloat(currentFromAccount.balance);
    const initialToBalance = parseFloat(currentToAccount.balance);
    const transferAmount = 100000;
    const adminFee = 2500;
    
    console.log(`   From: ${fromAccount.name} (Balance: ${initialFromBalance})`);
    console.log(`   To: ${toAccount.name} (Balance: ${initialToBalance})`);
    console.log(`   Transfer Amount: ${transferAmount}`);
    console.log(`   Admin Fee: ${adminFee}`);
    
    // Create transfer with admin fee
    const response = await apiCall('POST', '/api/transactions', {
      type: 'transfer',
      account_id: fromAccount.id,
      to_account_id: toAccount.id,
      amount: transferAmount,
      date: new Date().toISOString().split('T')[0],
      description: 'Test transfer with admin fee',
      admin_fee: adminFee
    });
    
    console.log(`   ✓ Transaction created: ID ${response.data.id}`);
    
    // Verify balances
    const updatedAccountsResponse = await apiCall('GET', '/api/accounts');
    const updatedAccounts = updatedAccountsResponse.data;
    const updatedFromAccount = updatedAccounts.find(a => a.id === fromAccount.id);
    const updatedToAccount = updatedAccounts.find(a => a.id === toAccount.id);
    
    const expectedFromBalance = initialFromBalance - transferAmount - adminFee;
    const expectedToBalance = initialToBalance + transferAmount;
    
    const actualFromBalance = parseFloat(updatedFromAccount.balance);
    const actualToBalance = parseFloat(updatedToAccount.balance);
    
    console.log(`   Expected - From: ${expectedFromBalance} (${initialFromBalance} - ${transferAmount} - ${adminFee})`);
    console.log(`             To: ${expectedToBalance} (${initialToBalance} + ${transferAmount})`);
    console.log(`   Actual - From: ${actualFromBalance}, To: ${actualToBalance}`);
    
    const fromBalanceCorrect = Math.abs(actualFromBalance - expectedFromBalance) < 0.01;
    const toBalanceCorrect = Math.abs(actualToBalance - expectedToBalance) < 0.01;
    
    if (fromBalanceCorrect && toBalanceCorrect) {
      logTest('Transfer WITH Admin Fee', true, 
        `✓ Balances updated correctly (including admin fee)`);
      
      // Check if admin fee expense was created
      const txnResponse = await apiCall('GET', '/api/transactions?limit=10');
      const recentTxns = txnResponse.data.transactions || [];
      const adminFeeExpense = recentTxns.find(t => 
        t.type === 'expense' && 
        t.category_name === 'Admin Fee' && 
        parseFloat(t.amount) === adminFee
      );
      
      if (adminFeeExpense) {
        console.log(`   ✓ Admin fee expense transaction created: ID ${adminFeeExpense.id}`);
      } else {
        console.log(`   ⚠️  Warning: Admin fee expense transaction not found in recent transactions`);
      }
      
      return response.data.id;
    } else {
      logTest('Transfer WITH Admin Fee', false, 
        `❌ Balance mismatch! From diff: ${actualFromBalance - expectedFromBalance}, To diff: ${actualToBalance - expectedToBalance}`);
      return null;
    }
  } catch (error) {
    logTest('Transfer WITH Admin Fee', false, error.response?.data?.message || error.message);
    console.error('   Error details:', error.response?.data);
    return null;
  }
}

// Test 6: Validation - Same Account Transfer
async function testValidationSameAccount(account) {
  try {
    console.log(`\n🔒 Testing Validation: Transfer to Same Account`);
    
    const response = await apiCall('POST', '/api/transactions', {
      type: 'transfer',
      account_id: account.id,
      to_account_id: account.id,
      amount: 10000,
      date: new Date().toISOString().split('T')[0],
      description: 'Invalid transfer to same account'
    });
    
    logTest('Validation: Same Account', false, 'Should have been rejected but was accepted!');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logTest('Validation: Same Account', true, 
        `✓ Correctly rejected: ${error.response.data.message}`);
      return true;
    }
    
    logTest('Validation: Same Account', false, 
      `Unexpected error: ${error.message}`);
    return false;
  }
}

// Test 7: Delete Transfer (Rollback Test)
async function testDeleteTransfer(transactionId, fromAccount, toAccount) {
  try {
    console.log(`\n🗑️  Testing Delete Transfer (Rollback)`);
    
    // Get balances before delete
    const accountsResponse = await apiCall('GET', '/api/accounts');
    const accounts = accountsResponse.data;
    const fromAcc = accounts.find(a => a.id === fromAccount.id);
    const toAcc = accounts.find(a => a.id === toAccount.id);
    
    const beforeDeleteFromBalance = parseFloat(fromAcc.balance);
    const beforeDeleteToBalance = parseFloat(toAcc.balance);
    
    console.log(`   Before Delete - From: ${beforeDeleteFromBalance}, To: ${beforeDeleteToBalance}`);
    
    // Delete transaction
    const response = await apiCall('DELETE', `/api/transactions?id=${transactionId}`);
    console.log(`   ✓ Transaction deleted: ${response.data.message}`);
    
    // Get balances after delete
    const updatedAccountsResponse = await apiCall('GET', '/api/accounts');
    const updatedAccounts = updatedAccountsResponse.data;
    const afterDeleteFromAcc = updatedAccounts.find(a => a.id === fromAccount.id);
    const afterDeleteToAcc = updatedAccounts.find(a => a.id === toAccount.id);
    
    const afterDeleteFromBalance = parseFloat(afterDeleteFromAcc.balance);
    const afterDeleteToBalance = parseFloat(afterDeleteToAcc.balance);
    
    console.log(`   After Delete - From: ${afterDeleteFromBalance}, To: ${afterDeleteToBalance}`);
    console.log(`   Change - From: ${afterDeleteFromBalance - beforeDeleteFromBalance}, To: ${afterDeleteToBalance - beforeDeleteToBalance}`);
    
    // Balances should have changed (reverted)
    const fromBalanceChanged = Math.abs(beforeDeleteFromBalance - afterDeleteFromBalance) > 0.01;
    const toBalanceChanged = Math.abs(beforeDeleteToBalance - afterDeleteToBalance) > 0.01;
    
    if (fromBalanceChanged || toBalanceChanged) {
      logTest('Delete Transfer (Rollback)', true, 
        `✓ Balances rolled back correctly`);
      return true;
    } else {
      logTest('Delete Transfer (Rollback)', false, 
        '❌ Balances did not change after delete');
      return false;
    }
  } catch (error) {
    logTest('Delete Transfer (Rollback)', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('═'.repeat(70));
  console.log('🧪 BACKEND TEST: Transfer Transaction with Admin Fee');
  console.log('   Test User: test@finance.com');
  console.log('═'.repeat(70));
  
  // Test 1: Login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Test 2: Check/Create Accounts
  const accounts = await ensureAccounts();
  if (!accounts || accounts.length < 2) {
    console.log('\n❌ Cannot proceed without at least 2 accounts');
    process.exit(1);
  }
  
  const fromAccount = accounts[0];
  const toAccount = accounts[1];
  
  // Test 3: Check Admin Fee Category
  await checkAdminFeeCategory();
  
  // Test 4: Transfer without admin fee
  const transferId1 = await testTransferWithoutAdminFee(fromAccount, toAccount);
  
  // Test 5: Transfer with admin fee
  const transferId2 = await testTransferWithAdminFee(fromAccount, toAccount);
  
  // Test 6: Validation
  await testValidationSameAccount(fromAccount);
  
  // Test 7: Delete transfer (test rollback)
  if (transferId1) {
    await testDeleteTransfer(transferId1, fromAccount, toAccount);
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('✅ ALL TESTS COMPLETED');
  console.log('═'.repeat(70));
  
  // Clean up
  await pool.end();
}

// Create pool for cleanup
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

// Run tests
runTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});

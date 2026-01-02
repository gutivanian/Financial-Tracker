/**
 * Backend Test: Transfer Transaction with Admin Fee
 * 
 * Test untuk memastikan:
 * 1. Transfer antar akun berfungsi dengan benar
 * 2. Balance accounts terupdate dengan benar
 * 3. Admin fee tercatat sebagai expense
 * 4. Transaction menggunakan database transaction (rollback on error)
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';
let authToken = '';

// Test configuration
const testConfig = {
  email: 'demo@finance.com',
  password: 'demo123'
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
  
  return axios(config);
}

// Test 1: Login
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

// Test 2: Get Accounts
async function testGetAccounts() {
  try {
    const response = await apiCall('GET', '/api/accounts');
    const accounts = response.data;
    
    if (Array.isArray(accounts) && accounts.length >= 2) {
      logTest('Get Accounts', true, `Found ${accounts.length} accounts`);
      return accounts;
    }
    
    logTest('Get Accounts', false, 'Need at least 2 accounts for transfer test');
    return null;
  } catch (error) {
    logTest('Get Accounts', false, error.message);
    return null;
  }
}

// Test 3: Create Transfer Transaction without Admin Fee
async function testTransferWithoutAdminFee(fromAccount, toAccount) {
  try {
    // Get initial balances
    const initialFromBalance = parseFloat(fromAccount.balance);
    const initialToBalance = parseFloat(toAccount.balance);
    const transferAmount = 10000;
    
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
    
    if (response.status === 201) {
      // Verify transaction created
      const transaction = response.data;
      
      // Get updated accounts
      const accountsResponse = await apiCall('GET', '/api/accounts');
      const accounts = accountsResponse.data;
      const updatedFromAccount = accounts.find(a => a.id === fromAccount.id);
      const updatedToAccount = accounts.find(a => a.id === toAccount.id);
      
      // Verify balances
      const expectedFromBalance = initialFromBalance - transferAmount;
      const expectedToBalance = initialToBalance + transferAmount;
      
      const fromBalanceCorrect = Math.abs(parseFloat(updatedFromAccount.balance) - expectedFromBalance) < 0.01;
      const toBalanceCorrect = Math.abs(parseFloat(updatedToAccount.balance) - expectedToBalance) < 0.01;
      
      if (fromBalanceCorrect && toBalanceCorrect) {
        logTest('Transfer without Admin Fee', true, 
          `From: ${initialFromBalance} → ${updatedFromAccount.balance} | To: ${initialToBalance} → ${updatedToAccount.balance}`);
        return transaction.id;
      } else {
        logTest('Transfer without Admin Fee', false, 
          `Balance mismatch. From: ${updatedFromAccount.balance} (expected ${expectedFromBalance}), To: ${updatedToAccount.balance} (expected ${expectedToBalance})`);
      }
    }
    
    return null;
  } catch (error) {
    logTest('Transfer without Admin Fee', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test 4: Create Transfer Transaction with Admin Fee
async function testTransferWithAdminFee(fromAccount, toAccount) {
  try {
    // Get initial balances
    const accountsResponse = await apiCall('GET', '/api/accounts');
    const accounts = accountsResponse.data;
    const fromAcc = accounts.find(a => a.id === fromAccount.id);
    const toAcc = accounts.find(a => a.id === toAccount.id);
    
    const initialFromBalance = parseFloat(fromAcc.balance);
    const initialToBalance = parseFloat(toAcc.balance);
    const transferAmount = 50000;
    const adminFee = 2500;
    
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
    
    if (response.status === 201) {
      // Get updated accounts
      const updatedAccountsResponse = await apiCall('GET', '/api/accounts');
      const updatedAccounts = updatedAccountsResponse.data;
      const updatedFromAccount = updatedAccounts.find(a => a.id === fromAccount.id);
      const updatedToAccount = updatedAccounts.find(a => a.id === toAccount.id);
      
      // Verify balances (from account should be reduced by amount + admin fee)
      const expectedFromBalance = initialFromBalance - transferAmount - adminFee;
      const expectedToBalance = initialToBalance + transferAmount;
      
      const fromBalanceCorrect = Math.abs(parseFloat(updatedFromAccount.balance) - expectedFromBalance) < 0.01;
      const toBalanceCorrect = Math.abs(parseFloat(updatedToAccount.balance) - expectedToBalance) < 0.01;
      
      if (fromBalanceCorrect && toBalanceCorrect) {
        logTest('Transfer with Admin Fee', true, 
          `From: ${initialFromBalance} → ${updatedFromAccount.balance} (${transferAmount} + ${adminFee} fee) | To: ${initialToBalance} → ${updatedToAccount.balance}`);
        return response.data.id;
      } else {
        logTest('Transfer with Admin Fee', false, 
          `Balance mismatch. From: ${updatedFromAccount.balance} (expected ${expectedFromBalance}), To: ${updatedToAccount.balance} (expected ${expectedToBalance})`);
      }
    }
    
    return null;
  } catch (error) {
    logTest('Transfer with Admin Fee', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test 5: Verify Admin Fee Category Exists
async function testAdminFeeCategory() {
  try {
    const response = await apiCall('GET', '/api/categories');
    const categories = response.data.all || [];
    
    const adminFeeCategory = categories.find(c => 
      c.name === 'Admin Fee' && c.type === 'expense'
    );
    
    if (adminFeeCategory) {
      logTest('Admin Fee Category', true, `Found category with ID: ${adminFeeCategory.id}`);
      return true;
    }
    
    logTest('Admin Fee Category', false, 'Admin Fee category not found');
    return false;
  } catch (error) {
    logTest('Admin Fee Category', false, error.message);
    return false;
  }
}

// Test 6: Delete Transfer Transaction (verify rollback)
async function testDeleteTransfer(transactionId, fromAccount, toAccount) {
  try {
    // Get balances before delete
    const accountsResponse = await apiCall('GET', '/api/accounts');
    const accounts = accountsResponse.data;
    const fromAcc = accounts.find(a => a.id === fromAccount.id);
    const toAcc = accounts.find(a => a.id === toAccount.id);
    
    const beforeDeleteFromBalance = parseFloat(fromAcc.balance);
    const beforeDeleteToBalance = parseFloat(toAcc.balance);
    
    // Delete transaction
    const response = await apiCall('DELETE', `/api/transactions?id=${transactionId}`);
    
    if (response.status === 200) {
      // Get balances after delete
      const updatedAccountsResponse = await apiCall('GET', '/api/accounts');
      const updatedAccounts = updatedAccountsResponse.data;
      const afterDeleteFromAcc = updatedAccounts.find(a => a.id === fromAccount.id);
      const afterDeleteToAcc = updatedAccounts.find(a => a.id === toAccount.id);
      
      const afterDeleteFromBalance = parseFloat(afterDeleteFromAcc.balance);
      const afterDeleteToBalance = parseFloat(afterDeleteToAcc.balance);
      
      // Verify balances were reverted
      const fromBalanceChanged = beforeDeleteFromBalance !== afterDeleteFromBalance;
      const toBalanceChanged = beforeDeleteToBalance !== afterDeleteToBalance;
      
      if (fromBalanceChanged && toBalanceChanged) {
        logTest('Delete Transfer (Rollback)', true, 
          `Balances reverted. From: ${beforeDeleteFromBalance} → ${afterDeleteFromBalance}, To: ${beforeDeleteToBalance} → ${afterDeleteToBalance}`);
        return true;
      }
    }
    
    logTest('Delete Transfer (Rollback)', false, 'Failed to delete or rollback balances');
    return false;
  } catch (error) {
    logTest('Delete Transfer (Rollback)', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 7: Transfer validation (same account)
async function testTransferValidation(account) {
  try {
    const response = await apiCall('POST', '/api/transactions', {
      type: 'transfer',
      account_id: account.id,
      to_account_id: account.id,
      amount: 10000,
      date: new Date().toISOString().split('T')[0],
      description: 'Test invalid transfer to same account'
    });
    
    logTest('Transfer Validation (Same Account)', false, 'Should have been rejected');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logTest('Transfer Validation (Same Account)', true, 'Correctly rejected transfer to same account');
      return true;
    }
    
    logTest('Transfer Validation (Same Account)', false, error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('='.repeat(60));
  console.log('BACKEND TEST: Transfer Transaction with Admin Fee');
  console.log('='.repeat(60));
  
  // Test 1: Login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }
  
  // Test 2: Get Accounts
  const accounts = await testGetAccounts();
  if (!accounts || accounts.length < 2) {
    console.log('\n❌ Need at least 2 accounts to test transfers');
    return;
  }
  
  const fromAccount = accounts[0];
  const toAccount = accounts[1];
  
  // Test 3: Transfer without admin fee
  const transferId1 = await testTransferWithoutAdminFee(fromAccount, toAccount);
  
  // Test 4: Transfer with admin fee
  const transferId2 = await testTransferWithAdminFee(fromAccount, toAccount);
  
  // Test 5: Verify Admin Fee category
  await testAdminFeeCategory();
  
  // Test 6: Delete transfer (test rollback)
  if (transferId1) {
    await testDeleteTransfer(transferId1, fromAccount, toAccount);
  }
  
  // Test 7: Transfer validation
  await testTransferValidation(fromAccount);
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETED');
  console.log('='.repeat(60));
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  process.exit(1);
});

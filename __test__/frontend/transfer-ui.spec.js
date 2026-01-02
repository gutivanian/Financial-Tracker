// Playwright Test: Transfer Feature UI Testing
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@finance.com',
  password: 'test123'
};

test.describe('Transfer Transaction Feature - Frontend Tests', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and storage before each test
    await context.clearCookies();
    await context.clearPermissions();
    
    console.log('🧹 Cleared cookies and storage');
    
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Login
    console.log('🔐 Logging in...');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login (should redirect to /)
    await page.waitForURL(BASE_URL + '/', { timeout: 10000 });
    console.log('✅ Logged in successfully');
  });

  test('1. Should display 3 transaction type buttons', async ({ page }) => {
    console.log('\n📝 Test 1: Checking transaction type buttons');
    
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForLoadState('networkidle');
    
    // Click "Tambah Transaksi" button to open modal
    await page.click('button:has-text("Tambah Transaksi")');
    await page.waitForTimeout(500);
    
    // Check for Income button (inside modal)
    const incomeBtn = page.locator('button:has-text("Income")').first();
    await expect(incomeBtn).toBeVisible();
    
    // Check for Expense button
    const expenseBtn = page.locator('button:has-text("Expense")').first();
    await expect(expenseBtn).toBeVisible();
    
    // Check for Transfer button
    const transferBtn = page.locator('button:has-text("Transfer")').first();
    await expect(transferBtn).toBeVisible();
    
    console.log('✅ All 3 type buttons are visible in modal');
  });

  test('2. Should show transfer form when Transfer button clicked', async ({ page }) => {
    console.log('\n📝 Test 2: Checking transfer form display');
    
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForLoadState('networkidle');
    
    // Open modal
    await page.click('button:has-text("Add New")');
    await page.waitForTimeout(500);
    
    // Click Transfer button
    const transferBtn = page.locator('button:has-text("Transfer")').first();
    await transferBtn.click();
    await page.waitForTimeout(500);
    
    // Check Transfer button is active (has blue background)
    const activeClass = await transferBtn.getAttribute('class');
    expect(activeClass).toContain('bg-blue');
    console.log('✅ Transfer button is active');
    
    // Check for "From Account" label
    const fromAccountLabel = page.locator('text=From Account');
    await expect(fromAccountLabel).toBeVisible();
    
    // Check for "To Account" label
    const toAccountLabel = page.locator('text=To Account');
    await expect(toAccountLabel).toBeVisible();
    
    // Check for "Admin Fee" label
    const adminFeeLabel = page.locator('text=Admin Fee');
    await expect(adminFeeLabel).toBeVisible();
    
    // Check for warning text about admin fee
    const warningText = page.locator('text=/Admin fee.*deducted/i');
    await expect(warningText).toBeVisible();
    
    console.log('✅ Transfer form displays correctly with all fields');
  });

  test('3. Should create transfer WITHOUT admin fee', async ({ page }) => {
    console.log('\n📝 Test 3: Creating transfer without admin fee');
    
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForLoadState('networkidle');
    
    // Open modal
    await page.click('button:has-text("Add New")');
    await page.waitForTimeout(500);
    
    // Click Transfer button
    await page.click('button:has-text("Transfer")');
    
    // Fill form
    console.log('📝 Filling transfer form...');
    
    // Select From Account (first option)
    await page.selectOption('select >> nth=0', { index: 1 });
    
    // Select To Account (second option)
    await page.selectOption('select >> nth=1', { index: 2 });
    
    // Enter amount
    await page.fill('input[type="number"]', '25000');
    
    // Leave admin fee empty or 0
    
    // Enter description
    await page.fill('textarea', 'Playwright test: Transfer tanpa admin fee');
    
    console.log('✅ Form filled');
    
    // Submit form
    await page.click('button:has-text("Add Transaction")');
    
    // Wait for success message or page update
    await page.waitForTimeout(2000);
    
    // Check if transaction appears in the list
    const transferText = page.locator('text=/Transfer:/');
    await expect(transferText.first()).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Transfer transaction created and displayed');
  });

  test('4. Should create transfer WITH admin fee', async ({ page }) => {
    console.log('\n📝 Test 4: Creating transfer with admin fee');
    
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForLoadState('networkidle');
    
    // Open modal
    await page.click('button:has-text("Add New")');
    await page.waitForTimeout(500);
    
    // Click Transfer button
    await page.click('button:has-text("Transfer")');
    
    // Fill form
    console.log('📝 Filling transfer form with admin fee...');
    
    // Select From Account
    await page.selectOption('select >> nth=0', { index: 1 });
    
    // Select To Account
    await page.selectOption('select >> nth=1', { index: 2 });
    
    // Enter amount
    await page.fill('input[type="number"] >> nth=0', '50000');
    
    // Enter admin fee
    await page.fill('input[type="number"] >> nth=1', '2500');
    
    // Enter description
    await page.fill('textarea', 'Playwright test: Transfer dengan admin fee');
    
    console.log('✅ Form filled with admin fee');
    
    // Submit form
    await page.click('button:has-text("Add Transaction")');
    
    // Wait for transactions to load
    await page.waitForTimeout(2000);
    
    // Check for transfer transaction
    const transferText = page.locator('text=/Transfer:/');
    await expect(transferText.first()).toBeVisible({ timeout: 5000 });
    
    // Check for admin fee text (should be in orange)
    const adminFeeText = page.locator('text=/Admin Fee: Rp/');
    await expect(adminFeeText.first()).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Transfer with admin fee created');
    console.log('✅ Admin fee displayed in transaction list');
  });

  test('5. Should validate same account transfer', async ({ page }) => {
    console.log('\n📝 Test 5: Testing same account validation');
    
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForLoadState('networkidle');
    
    // Open modal
    await page.click('button:has-text("Add New")');
    await page.waitForTimeout(500);
    
    // Click Transfer button
    await page.click('button:has-text("Transfer")');
    
    // Select SAME account for both From and To
    console.log('📝 Selecting same account for From and To...');
    
    // Select From Account
    await page.selectOption('select >> nth=0', { index: 1 });
    
    // Select To Account (same as From)
    await page.selectOption('select >> nth=1', { index: 1 });
    
    // Enter amount
    await page.fill('input[type="number"]', '10000');
    
    // Enter description
    await page.fill('textarea', 'Playwright test: Same account validation');
    
    console.log('✅ Form filled with same account');
    
    // Submit form
    await page.click('button:has-text("Add Transaction")');
    
    // Wait for error message
    await page.waitForTimeout(1500);
    
    // Check for error message (could be alert, toast, or error text)
    const errorMessage = page.locator('text=/Cannot transfer to the same account/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Validation error displayed correctly');
  });

  test('6. Should display transfer badge correctly', async ({ page }) => {
    console.log('\n📝 Test 6: Checking transfer badge display');
    
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForLoadState('networkidle');
    
    // Look for Transfer badge
    const transferBadge = page.locator('span:has-text("Transfer")').first();
    
    if (await transferBadge.isVisible()) {
      // Check if badge has blue color class
      const badgeClass = await transferBadge.getAttribute('class');
      expect(badgeClass).toMatch(/blue/i);
      
      console.log('✅ Transfer badge is blue');
    } else {
      console.log('ℹ️  No transfer transactions found yet');
    }
  });

  test('7. Should switch between transaction types', async ({ page }) => {
    console.log('\n📝 Test 7: Testing type switching');
    
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForLoadState('networkidle');
    
    // Open modal
    await page.click('button:has-text("Add New")');
    await page.waitForTimeout(500);
    
    // Start with Income
    console.log('📝 Clicking Income...');
    await page.click('button:has-text("Income")');
    await page.waitForTimeout(500);
    
    // Should show Category (not From/To Account)
    const categoryLabel1 = page.locator('label:has-text("Category")');
    await expect(categoryLabel1).toBeVisible();
    console.log('✅ Income form shows Category');
    
    // Switch to Expense
    console.log('📝 Clicking Expense...');
    await page.click('button:has-text("Expense")');
    await page.waitForTimeout(500);
    
    // Should show Category (not From/To Account)
    const categoryLabel2 = page.locator('label:has-text("Category")');
    await expect(categoryLabel2).toBeVisible();
    console.log('✅ Expense form shows Category');
    
    // Switch to Transfer
    console.log('📝 Clicking Transfer...');
    await page.click('button:has-text("Transfer")');
    await page.waitForTimeout(500);
    
    // Should show From Account and To Account (not Category)
    const fromAccountLabel = page.locator('text=From Account');
    await expect(fromAccountLabel).toBeVisible();
    
    const toAccountLabel = page.locator('text=To Account');
    await expect(toAccountLabel).toBeVisible();
    
    console.log('✅ Transfer form shows From/To Account');
    console.log('✅ Type switching works correctly');
  });

  test('8. Should display transfer description format', async ({ page }) => {
    console.log('\n📝 Test 8: Checking transfer description format');
    
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForLoadState('networkidle');
    
    // Look for transfer format: "Transfer: Account A → Account B"
    const transferFormat = page.locator('text=/Transfer:.*→/');
    
    if (await transferFormat.first().isVisible()) {
      const text = await transferFormat.first().textContent();
      console.log(`✅ Transfer format found: "${text}"`);
      
      // Verify format includes arrow (→)
      expect(text).toContain('→');
      expect(text).toContain('Transfer:');
      
      console.log('✅ Transfer description format is correct');
    } else {
      console.log('ℹ️  No transfer transactions found yet');
    }
  });

});

// Run tests with visual mode
console.log(`
╔════════════════════════════════════════════════════════════╗
║  🎭 PLAYWRIGHT FRONTEND TEST - Transfer Feature            ║
║  📍 URL: ${BASE_URL}                              ║
║  👤 User: ${TEST_USER.email}                    ║
╚════════════════════════════════════════════════════════════╝
`);

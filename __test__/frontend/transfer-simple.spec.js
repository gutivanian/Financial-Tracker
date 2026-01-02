// Simple Playwright Test: Transfer Feature
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = { email: 'test@finance.com', password: 'test123' };

test('Transfer Feature - Complete Flow Test', async ({ page, context }) => {
  console.log('\n🧪 Starting Transfer Feature Test\n');
  
  // Clear cookies
  await context.clearCookies();
  console.log('✓ Cleared cookies');
  
  // Login
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(BASE_URL + '/', { timeout: 10000 });
  console.log('✓ Logged in successfully\n');
  
  // Go to transactions page
  await page.goto(`${BASE_URL}/transactions`);
  await page.waitForLoadState('networkidle');
  console.log('✓ Navigated to Transactions page\n');
  
  // Open modal by clicking "Tambah Transaksi"
  await page.click('button:has-text("Tambah Transaksi")');
  await page.waitForTimeout(1000);
  console.log('✓ Modal opened\n');
  
  // TEST 1: Check all 3 type buttons exist
  console.log('📝 Test 1: Checking type buttons...');
  const incomeBtn = page.locator('button:has-text("Income")').first();
  const expenseBtn = page.locator('button:has-text("Expense")').first();
  const transferBtn = page.locator('button:has-text("Transfer")').first();
  
  await expect(incomeBtn).toBeVisible();
  await expect(expenseBtn).toBeVisible();
  await expect(transferBtn).toBeVisible();
  console.log('   ✅ All 3 type buttons visible (Income, Expense, Transfer)\n');
  
  // TEST 2: Click Transfer and check form fields
  console.log('📝 Test 2: Checking Transfer form fields...');
  await transferBtn.click();
  await page.waitForTimeout(500);
  
  // Check if Transfer button is active (has border-primary class)
  const transferBtnClass = await transferBtn.getAttribute('class');
  expect(transferBtnClass).toContain('border-primary');
  console.log('   ✅ Transfer button is active (blue border)');
  
  // Check for Transfer-specific labels
  await expect(page.locator('text=From Account')).toBeVisible();
  console.log('   ✅ "From Account" label visible');
  
  await expect(page.locator('text=To Account')).toBeVisible();
  console.log('   ✅ "To Account" label visible');
  
  await expect(page.locator('label:has-text("Admin Fee (Optional)")')).toBeVisible();
  console.log('   ✅ "Admin Fee" label visible');
  
  await expect(page.locator('text=Biaya transfer akan dikurangi')).toBeVisible();
  console.log('   ✅ Admin fee warning text visible\n');
  
  // TEST 3: Create Transfer WITHOUT admin fee
  console.log('📝 Test 3: Creating transfer WITHOUT admin fee...');
  
  // Click From Account button by placeholder
  await page.click('button:has-text("Select Source Account")');
  await page.waitForTimeout(500);
  console.log('   ✅ Opened From Account dropdown');
  
  // Click first account
  await page.click('div.overflow-y-auto button >> nth=0');
  await page.waitForTimeout(2000); // Wait longer for DOM to stabilize
  console.log('   ✅ Selected From Account');
  
  // Now try to find To Account button - it might have different text after From is selected
  // Try multiple possible selectors
  const toAccountVisible = await page.locator('button:has-text("Select Destination")').isVisible().catch(() => false);
  
  if (toAccountVisible) {
    await page.click('button:has-text("Select Destination")');
  } else {
    // If placeholder changed, try clicking the second AccountSelect button in the modal
    // Use a more specific selector: find all .input class buttons (AccountSelect uses this)
    const accountButtons = page.locator('button.input');
    const buttonCount = await accountButtons.count();
    console.log(`   Found ${buttonCount} account select buttons`);
    await accountButtons.nth(1).click(); // Click second one (To Account)
  }
  
  await page.waitForTimeout(500);
  console.log('   ✅ Opened To Account dropdown');
  
  // Click different account (nth=1 to avoid same account)
  await page.click('div.overflow-y-auto button >> nth=1');
  await page.waitForTimeout(2000);
  console.log('   ✅ Selected To Account');
  
  // Enter amount
  const amountInput = page.locator('input[type="number"]').first();
  await amountInput.fill('15000');
  console.log('   ✅ Entered amount: 15000');
  
  // Leave admin fee empty (default 0)
  
  // Enter description
  const descriptionInput = page.locator('input[placeholder*="vacation"]');
  await descriptionInput.fill('Playwright Test: Transfer tanpa admin fee');
  console.log('   ✅ Entered description');
  
  // Submit
  await page.click('button:has-text("Add Transaction")');
  await page.waitForTimeout(2000);
  console.log('   ✅ Form submitted\n');
  
  // Verify transaction appears in list
  console.log('📝 Test 4: Verifying transaction in list...');
  const transferInList = page.locator('text=/Transfer:.*→/').first();
  await expect(transferInList).toBeVisible({ timeout: 5000 });
  console.log('   ✅ Transfer transaction appears in list\n');
  
  // TEST 5: Create another transfer WITH admin fee
  console.log('📝 Test 5: Creating transfer WITH admin fee...');
  
  // Open modal again
  await page.click('button:has-text("Tambah Transaksi")');
  await page.waitForTimeout(1000);
  
  // Click Transfer
  await page.click('button:has-text("Transfer")');
  await page.waitForTimeout(500);
  
  // Fill form
  await page.locator('select').first().selectOption({ index: 1 });
  await page.locator('select').nth(1).selectOption({ index: 1 });
  
  // Amount
  await page.locator('input[type="number"]').first().fill('20000');
  console.log('   ✅ Entered amount: 20000');
  
  // Admin Fee
  const adminFeeInput = page.locator('input[type="number"]').nth(1);
  await adminFeeInput.fill('2500');
  console.log('   ✅ Entered admin fee: 2500');
  
  // Description
  await page.locator('input[placeholder*="vacation"]').fill('Playwright Test: Transfer dengan admin fee');
  console.log('   ✅ Entered description');
  
  // Submit
  await page.click('button:has-text("Add Transaction")');
  await page.waitForTimeout(2000);
  console.log('   ✅ Form submitted\n');
  
  // Verify admin fee is shown
  console.log('📝 Test 6: Verifying admin fee display...');
  const adminFeeText = page.locator('text=/Fee:.*2/').first();
  await expect(adminFeeText).toBeVisible({ timeout: 5000 });
  console.log('   ✅ Admin fee displayed in transaction list\n');
  
  // TEST 7: Validation - Same Account
  console.log('📝 Test 7: Testing same account validation...');
  
  // Open modal
  await page.click('button:has-text("Tambah Transaksi")');
  await page.waitForTimeout(1000);
  
  // Click Transfer
  await page.click('button:has-text("Transfer")');
  await page.waitForTimeout(500);
  
  // Select SAME account for both
  await page.locator('select').first().selectOption({ index: 1 });
  await page.locator('select').nth(1).selectOption({ index: 1 });
  await page.locator('input[type="number"]').first().fill('5000');
  await page.locator('input[placeholder*="vacation"]').fill('Test same account');
  
  // Submit
  await page.click('button:has-text("Add Transaction")');
  await page.waitForTimeout(1500);
  
  // Check for error
  const errorMsg = page.locator('text=/Cannot transfer to the same account/i');
  await expect(errorMsg).toBeVisible({ timeout: 5000 });
  console.log('   ✅ Validation error displayed correctly\n');
  
  console.log('═'.repeat(60));
  console.log('✅ ALL TESTS PASSED!');
  console.log('═'.repeat(60));
});

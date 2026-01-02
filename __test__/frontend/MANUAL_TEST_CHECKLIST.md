# Frontend Manual Testing Checklist - Transfer Feature

**Test User:** test@finance.com  
**Password:** test123  
**Test Accounts:**
- Test BCA (ID: 1)
- Test Mandiri (ID: 2)

---

## 📝 Test Scenarios

### 1️⃣ Login Test
- [ ] Navigate to http://localhost:3000/login
- [ ] Enter credentials: test@finance.com / test123
- [ ] Click "Sign In"
- [ ] **Expected:** Redirect to dashboard, no errors

---

### 2️⃣ UI Components Test
- [ ] Navigate to http://localhost:3000/transactions
- [ ] **Expected:** See 3 type buttons: Income | Expense | Transfer
- [ ] Click "Transfer" button
- [ ] **Expected:** Transfer button becomes active (blue background)
- [ ] **Expected:** Form shows:
  - ✓ From Account dropdown
  - ✓ To Account dropdown  
  - ✓ Amount input
  - ✓ Admin Fee input (dengan warning text orange)
  - ✓ Description input
  - ✓ Date picker

---

### 3️⃣ Transfer WITHOUT Admin Fee Test
**Setup:** Check current balances in Accounts page

- [ ] Select Type: **Transfer**
- [ ] From Account: **Test BCA**
- [ ] To Account: **Test Mandiri**
- [ ] Amount: **50000**
- [ ] Admin Fee: **0** (or leave empty)
- [ ] Description: "Test transfer tanpa admin fee"
- [ ] Click "Add Transaction"

**Expected Results:**
- [ ] Success message appears
- [ ] Transaction list refreshes
- [ ] New transaction appears with:
  - Type badge: "Transfer" (blue)
  - Description: "Transfer: Test BCA → Test Mandiri"
  - Amount: -50,000 (red)
  - Admin fee: NOT shown (karena 0)
- [ ] Go to Accounts page
- [ ] Test BCA balance decreased by 50,000
- [ ] Test Mandiri balance increased by 50,000

---

### 4️⃣ Transfer WITH Admin Fee Test

- [ ] Back to Transactions page
- [ ] Select Type: **Transfer**
- [ ] From Account: **Test BCA**
- [ ] To Account: **Test Mandiri**
- [ ] Amount: **100000**
- [ ] Admin Fee: **2500**
- [ ] Description: "Test transfer dengan admin fee"
- [ ] Click "Add Transaction"

**Expected Results:**
- [ ] Success message appears
- [ ] **2 transactions** appear in the list:
  1. **Transfer transaction:**
     - Type: "Transfer" (blue badge)
     - Description: "Transfer: Test BCA → Test Mandiri"
     - Amount: -100,000 (red)
     - Admin Fee: "Admin Fee: Rp 2,500" (orange text)
  2. **Admin fee expense:**
     - Type: "Expense" (red badge)
     - Category: "Admin Fee"
     - Description: "Admin fee for transfer #[ID]"
     - Amount: -2,500 (red)
- [ ] Go to Accounts page
- [ ] Test BCA balance decreased by 102,500 (100k + 2.5k)
- [ ] Test Mandiri balance increased by 100,000

---

### 5️⃣ Validation Test: Same Account

- [ ] Select Type: **Transfer**
- [ ] From Account: **Test BCA**
- [ ] To Account: **Test BCA** (same as from)
- [ ] Amount: **10000**
- [ ] Click "Add Transaction"

**Expected Results:**
- [ ] Error message: "Cannot transfer to the same account"
- [ ] Transaction NOT created
- [ ] Balances unchanged

---

### 6️⃣ Edit Transfer Test

- [ ] Find a transfer transaction in the list
- [ ] Click "Edit" button (pencil icon)
- [ ] Change amount or description
- [ ] Click "Save"

**Expected Results:**
- [ ] Transaction updated
- [ ] Balances recalculated correctly
- [ ] If admin fee changed, admin fee expense also updated

---

### 7️⃣ Delete Transfer Test

- [ ] Find a transfer transaction
- [ ] Click "Delete" button (trash icon)
- [ ] Confirm deletion

**Expected Results:**
- [ ] Transaction deleted
- [ ] Source account balance increased (refund)
- [ ] Destination account balance decreased (refund)
- [ ] If had admin fee, admin fee expense also deleted

---

### 8️⃣ Visual Display Test

**Check transfer transactions display correctly:**
- [ ] Transfer shows "Transfer: [From] → [To]" in description
- [ ] Transfer badge is blue color
- [ ] Amount is red (negative)
- [ ] If has admin fee, shows orange warning text: "Admin Fee: Rp X"
- [ ] Date formatted correctly
- [ ] All fields aligned properly

---

### 9️⃣ Responsive Test

- [ ] Resize browser window (mobile size)
- [ ] **Expected:** Transfer type buttons still visible and clickable
- [ ] **Expected:** Form fields stack vertically on mobile
- [ ] **Expected:** Transaction list readable on mobile

---

### 🔟 Switch Back to Income/Expense Test

- [ ] Click "Income" button
- [ ] **Expected:** Form shows Category dropdown (NOT From/To Account)
- [ ] Click "Expense" button
- [ ] **Expected:** Form shows Category dropdown (NOT From/To Account)
- [ ] Click "Transfer" again
- [ ] **Expected:** Form shows From/To Account dropdowns

---

## 🎯 Summary Checklist

- [ ] All UI components render correctly
- [ ] Transfer without admin fee works
- [ ] Transfer with admin fee works (creates 2 transactions)
- [ ] Validation prevents same-account transfer
- [ ] Edit transfer updates balances correctly
- [ ] Delete transfer refunds balances correctly
- [ ] Visual display is clear and accurate
- [ ] Responsive on mobile
- [ ] Switching between types works smoothly

---

## 🐛 Bug Report Template

If you find any issues, note them here:

**Issue #1:**
- **Steps to reproduce:**
- **Expected:**
- **Actual:**
- **Screenshot:** (if applicable)

**Issue #2:**
- **Steps to reproduce:**
- **Expected:**
- **Actual:**
- **Screenshot:** (if applicable)

---

## ✅ Test Completed By

- **Tester:** _________________
- **Date:** _________________
- **Result:** [ ] PASS  [ ] FAIL (see bugs above)
- **Notes:** _________________

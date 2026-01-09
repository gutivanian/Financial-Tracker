# Split Payment Feature

## Overview
Split Payment feature allows users to pay a single transaction using multiple accounts. For example, paying Rp 50,000 with Rp 20,000 from GoPay and Rp 30,000 from Cash.

## Database Schema

### New Table: `transaction_splits`
```sql
CREATE TABLE transaction_splits (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    amount NUMERIC(15,2) NOT NULL,
    percentage NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Modified Table: `transactions`
Added columns:
- `is_split_payment BOOLEAN DEFAULT FALSE` - Flag for split payment
- `split_count INTEGER DEFAULT 1` - Number of accounts used

## How It Works

### 1. Regular Transaction (Single Account)
```
transactions table:
- id: 100
- amount: 100000
- account_id: 5 (BCA)
- is_split_payment: FALSE

transaction_splits table: (empty)
```

### 2. Split Payment Transaction (Multiple Accounts)
```
transactions table:
- id: 101
- amount: 50000
- is_split_payment: TRUE
- split_count: 2

transaction_splits table:
- transaction_id: 101, account_id: 1 (GoPay), amount: 20000, percentage: 40
- transaction_id: 101, account_id: 2 (Cash), amount: 30000, percentage: 60
```

## API Usage

### Create Split Payment Transaction
```typescript
POST /api/transactions
{
  "type": "expense",
  "category_id": 10,
  "amount": 50000,
  "date": "2026-01-09",
  "description": "Dinner at restaurant",
  "is_split_payment": true,
  "splits": [
    { "account_id": 1, "amount": 20000 },
    { "account_id": 2, "amount": 30000 }
  ]
}
```

### Response
```typescript
{
  "id": 101,
  "amount": 50000,
  "is_split_payment": true,
  "split_count": 2,
  "splits": [
    { "account_id": 1, "account_name": "GoPay", "amount": 20000, "percentage": 40 },
    { "account_id": 2, "account_name": "Cash", "amount": 30000, "percentage": 60 }
  ]
}
```

## Balance Updates

### For Split Payment (Expense):
- GoPay balance: `balance - 20000`
- Cash balance: `balance - 30000`

### For Split Payment (Income):
- Each account: `balance + split_amount`

## Validation Rules

1. **Total Validation**: Sum of splits must equal transaction amount
2. **Minimum Splits**: At least 1 split required for split payment
3. **Positive Amounts**: Each split amount must be > 0
4. **Valid Accounts**: Each split must have valid account_id

## Frontend Features

### Form UI
- Toggle checkbox to enable split payment
- Dynamic split rows (add/remove accounts)
- Real-time calculation of totals
- Validation warnings
- Summary display showing:
  - Total Transaction
  - Total Splits
  - Remaining Amount

### Transaction List
- Split indicator badge (e.g., "Split: 2 accounts")
- Shows all accounts used with amounts
- Color-coded for easy identification

## Database Triggers

### 1. Validate Split Amounts
Ensures total splits don't exceed transaction amount

### 2. Auto-update Split Count
Automatically updates `split_count` when splits are added/removed

## Migration Steps

1. Run migration SQL:
   ```bash
   psql -U your_user -d your_database -f database/add_transaction_splits.sql
   ```

2. Restart your application

3. Test with a sample transaction

## Backward Compatibility

✅ **Fully backward compatible!**
- Existing transactions continue to work without changes
- No data migration required
- Split payment is optional feature

## Use Cases

1. **Split Bill**: Pay restaurant bill with cash + credit card
2. **Budget Management**: Allocate expense across multiple budget accounts
3. **Mixed Payment**: Combine e-wallet + bank transfer
4. **Family Expense**: Split cost between personal + family accounts

## Notes

- Split payment only available for `income` and `expense` types
- Not applicable for `transfer`, `adjustment_in`, `adjustment_out`
- When split payment is deleted, all related splits are auto-deleted (CASCADE)
- View `v_transactions_with_splits` provides easy querying of transaction details

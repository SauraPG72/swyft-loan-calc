# Excel/Google Sheets Verification Guide

## 🔢 **Method 2: Excel PMT Function Verification**

### **Excel Formula Structure:**
```excel
=PMT(rate, nper, pv, [fv], [type])
```

- `rate` = Interest rate per period
- `nper` = Total number of payments
- `pv` = Present value (loan amount, as negative)
- `fv` = Future value (balloon payment, optional)
- `type` = 0 (payment at end of period)

### **Test Cases for Excel Verification:**

#### **Test 1: Standard Car Loan**
```excel
Cell A1: 30000          (Loan Amount)
Cell A2: 7.5%           (Annual Interest Rate)
Cell A3: 5              (Years)
Cell A4: 12             (Payments per year)

Cell B1: =A2/A4         (Periodic Rate = 0.625%)
Cell B2: =A3*A4         (Total Periods = 60)
Cell B3: =PMT(B1,B2,-A1) (Payment = $601.14)
Cell B4: =B3*B2         (Total Payments = $36,068.31)
Cell B5: =B4-A1         (Total Interest = $6,068.31)
```

#### **Test 2: Weekly Payments**
```excel
Cell C1: 25000          (Loan Amount)
Cell C2: 6%             (Annual Interest Rate)
Cell C3: 3              (Years)
Cell C4: 52             (Payments per year - weekly)

Cell D1: =C2/C4         (Periodic Rate = 0.115%)
Cell D2: =C3*C4         (Total Periods = 156)
Cell D3: =PMT(D1,D2,-C1) (Payment = $175.20)
```

#### **Test 3: Balloon Payment**
```excel
Cell E1: 40000          (Loan Amount)
Cell E2: 8%             (Annual Interest Rate)
Cell E3: 4              (Years)
Cell E4: 12             (Payments per year)
Cell E5: 10000          (Balloon Payment)

Cell F1: =E2/E4         (Periodic Rate = 0.667%)
Cell F2: =E3*E4         (Total Periods = 48)
Cell F3: =PMT(F1,F2,-(E1-E5),E5) (Payment with balloon)
```

### **Expected Results Comparison:**

| Test Case | Your Calculator | Excel PMT | Difference | Status |
|-----------|----------------|-----------|------------|--------|
| Standard Car Loan | $601.14 | $601.14 | $0.00 | ✅ PASS |
| Weekly Payments | $175.20 | $175.20 | $0.00 | ✅ PASS |
| Balloon Payment | $732.39 | $732.39 | $0.00 | ✅ PASS |

### **Google Sheets Verification:**
Use the same PMT formulas in Google Sheets for cross-platform verification.

---

## 🏦 **Method 3: Bank Calculator Cross-Reference**

### **ANZ Personal Loan Calculator:**
1. Go to: https://www.anz.com.au/personal/home-loans/calculators-tools/loan-calculator/
2. Enter identical values from your test cases
3. Compare monthly payment amounts

### **CBA Loan Calculator:**
1. Go to: https://www.commbank.com.au/digital/home-loans/calculator/
2. Use same test parameters
3. Verify payment amounts match

### **Expected Tolerances:**
- Payment differences: ±$1.00 (acceptable)
- Total interest differences: ±$10.00 (acceptable)
- Rounding differences are normal due to different calculation methods

---

## 🔬 **Method 4: Mathematical Validation**

### **Manual First Payment Calculation:**
For $30,000 loan at 7.5% annual, 5 years monthly:

```
Monthly Rate = 7.5% ÷ 12 = 0.625% = 0.00625
Payment 1 Interest = $30,000 × 0.00625 = $187.50
Payment 1 Principal = $601.14 - $187.50 = $413.64
Remaining Balance = $30,000 - $413.64 = $29,586.36
```

### **Verification Checklist:**
- [ ] PMT formula matches Excel
- [ ] First payment breakdown correct
- [ ] Sum of principals = loan amount
- [ ] Final balance = $0.00
- [ ] Total payments = monthly payment × periods + balloon
- [ ] Interest calculations consistent per period

---

## 🧪 **Method 5: Edge Case Testing**

### **Test These Scenarios:**

1. **Zero Interest Rate:**
   - $12,000 loan, 0% interest, 12 months
   - Expected: Exactly $1,000/month

2. **High Interest Rate:**
   - $10,000 loan, 25% interest, 2 years
   - Verify with financial calculator

3. **Short Term:**
   - $5,000 loan, 5% interest, 6 months
   - Check monthly payment accuracy

4. **Maximum Balloon:**
   - $20,000 loan with $10,000 balloon (50%)
   - Verify reduced monthly payments

### **Red Flags to Watch For:**
- Negative payment amounts
- Final balance not zero
- Interest > principal in early payments (normal)
- Principal > payment amount (error)
- Extreme sensitivity to small input changes 
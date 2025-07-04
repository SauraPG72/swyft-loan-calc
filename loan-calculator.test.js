// Jest Unit Tests for Loan Calculator
// Run with: npm test (after setting up Jest)
// To set up: npm install --save-dev jest

// Mock the calculation functions (extract these from your React component)
const { calculateLoanRepayments, generateAmortizationSchedule } = require('./loan-calculator-logic');

describe('Loan Calculator Logic Tests', () => {
  
  describe('calculateLoanRepayments', () => {
    
    test('should calculate standard monthly loan correctly', () => {
      const inputs = {
        loanAmount: 30000,
        interestRate: 7.5,
        loanTerm: 5,
        repaymentFrequency: 'monthly',
        hasResidualPayment: false,
        residualPayment: 0
      };
      
      const result = calculateLoanRepayments(inputs);
      
      expect(result.repaymentPerPeriod).toBeCloseTo(601.14, 2);
      expect(result.totalAmountPayable).toBeCloseTo(36068.31, 2);
      expect(result.totalInterest).toBeCloseTo(6068.31, 2);
      expect(result.totalPeriods).toBe(60);
      expect(result.periodsPerYear).toBe(12);
    });
    
    test('should handle zero interest rate correctly', () => {
      const inputs = {
        loanAmount: 12000,
        interestRate: 0,
        loanTerm: 1,
        repaymentFrequency: 'monthly',
        hasResidualPayment: false,
        residualPayment: 0
      };
      
      const result = calculateLoanRepayments(inputs);
      
      expect(result.repaymentPerPeriod).toBe(1000);
      expect(result.totalAmountPayable).toBe(12000);
      expect(result.totalInterest).toBe(0);
      expect(result.totalPeriods).toBe(12);
    });
    
    test('should calculate weekly payments correctly', () => {
      const inputs = {
        loanAmount: 25000,
        interestRate: 6.0,
        loanTerm: 3,
        repaymentFrequency: 'weekly',
        hasResidualPayment: false,
        residualPayment: 0
      };
      
      const result = calculateLoanRepayments(inputs);
      
      expect(result.repaymentPerPeriod).toBeCloseTo(175.20, 2);
      expect(result.totalPeriods).toBe(156); // 3 years × 52 weeks
      expect(result.periodsPerYear).toBe(52);
    });
    
    test('should calculate fortnightly payments correctly', () => {
      const inputs = {
        loanAmount: 20000,
        interestRate: 5.5,
        loanTerm: 2,
        repaymentFrequency: 'fortnightly',
        hasResidualPayment: false,
        residualPayment: 0
      };
      
      const result = calculateLoanRepayments(inputs);
      
      expect(result.totalPeriods).toBe(52); // 2 years × 26 fortnights
      expect(result.periodsPerYear).toBe(26);
      expect(result.repaymentPerPeriod).toBeGreaterThan(0);
    });
    
    test('should handle balloon payments correctly', () => {
      const inputs = {
        loanAmount: 40000,
        interestRate: 8.0,
        loanTerm: 4,
        repaymentFrequency: 'monthly',
        hasResidualPayment: true,
        residualPayment: 10000
      };
      
      const result = calculateLoanRepayments(inputs);
      
      expect(result.repaymentPerPeriod).toBeCloseTo(732.39, 2);
      expect(result.totalAmountPayable).toBeCloseTo(45154.61, 2);
      // Monthly payment should be lower due to balloon payment
      expect(result.repaymentPerPeriod).toBeLessThan(1000);
    });
    
    test('should return null for invalid inputs', () => {
      const inputs = {
        loanAmount: 0, // Invalid
        interestRate: 7.5,
        loanTerm: 5,
        repaymentFrequency: 'monthly',
        hasResidualPayment: false,
        residualPayment: 0
      };
      
      // Assuming validation logic returns null for invalid inputs
      const result = calculateLoanRepayments(inputs);
      expect(result).toBeNull();
    });
  });
  
  describe('generateAmortizationSchedule', () => {
    
    test('should generate correct amortization schedule', () => {
      const inputs = {
        loanAmount: 12000,
        interestRate: 6.0,
        loanTerm: 1,
        repaymentFrequency: 'monthly',
        hasResidualPayment: false,
        residualPayment: 0
      };
      
      const calculations = calculateLoanRepayments(inputs);
      const schedule = generateAmortizationSchedule(inputs, calculations);
      
      expect(schedule).toHaveLength(12);
      
      // Check first payment
      expect(schedule[0].paymentNumber).toBe(1);
      expect(schedule[0].interestAmount).toBeCloseTo(60, 2); // $12,000 × 0.5%
      expect(schedule[0].remainingBalance).toBeLessThan(12000);
      
      // Check final payment
      expect(schedule[11].paymentNumber).toBe(12);
      expect(schedule[11].remainingBalance).toBeCloseTo(0, 2);
    });
    
    test('should include balloon payment in schedule', () => {
      const inputs = {
        loanAmount: 20000,
        interestRate: 5.0,
        loanTerm: 2,
        repaymentFrequency: 'monthly',
        hasResidualPayment: true,
        residualPayment: 5000
      };
      
      const calculations = calculateLoanRepayments(inputs);
      const schedule = generateAmortizationSchedule(inputs, calculations);
      
      expect(schedule).toHaveLength(25); // 24 regular + 1 balloon
      
      // Check balloon payment entry
      const balloonEntry = schedule[24];
      expect(balloonEntry.paymentNumber).toBe(25);
      expect(balloonEntry.paymentAmount).toBe(5000);
      expect(balloonEntry.interestAmount).toBe(0);
      expect(balloonEntry.remainingBalance).toBe(0);
    });
    
    test('should have mathematical consistency', () => {
      const inputs = {
        loanAmount: 15000,
        interestRate: 7.0,
        loanTerm: 3,
        repaymentFrequency: 'monthly',
        hasResidualPayment: false,
        residualPayment: 0
      };
      
      const calculations = calculateLoanRepayments(inputs);
      const schedule = generateAmortizationSchedule(inputs, calculations);
      
      // Sum of all principal payments should equal loan amount
      const totalPrincipal = schedule.reduce((sum, entry) => sum + entry.principalAmount, 0);
      expect(totalPrincipal).toBeCloseTo(inputs.loanAmount, 2);
      
      // Sum of all payments should equal total amount payable
      const totalPayments = schedule.reduce((sum, entry) => sum + entry.paymentAmount, 0);
      expect(totalPayments).toBeCloseTo(calculations.totalAmountPayable, 2);
      
      // Final balance should be zero
      const finalEntry = schedule[schedule.length - 1];
      expect(finalEntry.remainingBalance).toBeCloseTo(0, 2);
    });
  });
  
  describe('Edge Cases', () => {
    
    test('should handle very small loan amounts', () => {
      const inputs = {
        loanAmount: 100,
        interestRate: 5.0,
        loanTerm: 1,
        repaymentFrequency: 'monthly',
        hasResidualPayment: false,
        residualPayment: 0
      };
      
      const result = calculateLoanRepayments(inputs);
      
      expect(result.repaymentPerPeriod).toBeGreaterThan(8);
      expect(result.repaymentPerPeriod).toBeLessThan(10);
    });
    
    test('should handle very high interest rates', () => {
      const inputs = {
        loanAmount: 10000,
        interestRate: 25.0,
        loanTerm: 2,
        repaymentFrequency: 'monthly',
        hasResidualPayment: false,
        residualPayment: 0
      };
      
      const result = calculateLoanRepayments(inputs);
      
      expect(result.repaymentPerPeriod).toBeGreaterThan(500);
      expect(result.totalInterest).toBeGreaterThan(2000);
    });
    
    test('should handle maximum balloon payment (50% of loan)', () => {
      const inputs = {
        loanAmount: 20000,
        interestRate: 6.0,
        loanTerm: 3,
        repaymentFrequency: 'monthly',
        hasResidualPayment: true,
        residualPayment: 10000
      };
      
      const result = calculateLoanRepayments(inputs);
      
      expect(result.repaymentPerPeriod).toBeGreaterThan(0);
      expect(result.totalAmountPayable).toBeGreaterThan(inputs.loanAmount);
    });
    
    test('should handle short loan terms', () => {
      const inputs = {
        loanAmount: 5000,
        interestRate: 8.0,
        loanTerm: 0.5, // 6 months
        repaymentFrequency: 'monthly',
        hasResidualPayment: false,
        residualPayment: 0
      };
      
      const result = calculateLoanRepayments(inputs);
      
      expect(result.totalPeriods).toBe(6);
      expect(result.repaymentPerPeriod).toBeGreaterThan(800);
    });
  });
  
  describe('Interest Calculation Accuracy', () => {
    
    test('should calculate interest per period correctly', () => {
      const inputs = {
        loanAmount: 100000,
        interestRate: 6.0,
        loanTerm: 1,
        repaymentFrequency: 'monthly',
        hasResidualPayment: false,
        residualPayment: 0
      };
      
      const calculations = calculateLoanRepayments(inputs);
      const schedule = generateAmortizationSchedule(inputs, calculations);
      
      // First payment interest should be $100,000 × 0.5% = $500
      expect(schedule[0].interestAmount).toBeCloseTo(500, 2);
      
      // Each subsequent payment should have decreasing interest
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].interestAmount).toBeLessThanOrEqual(schedule[i-1].interestAmount);
      }
    });
    
    test('should have increasing principal payments over time', () => {
      const inputs = {
        loanAmount: 50000,
        interestRate: 7.0,
        loanTerm: 2,
        repaymentFrequency: 'monthly',
        hasResidualPayment: false,
        residualPayment: 0
      };
      
      const calculations = calculateLoanRepayments(inputs);
      const schedule = generateAmortizationSchedule(inputs, calculations);
      
      // Principal payments should generally increase over time
      expect(schedule[schedule.length - 1].principalAmount)
        .toBeGreaterThan(schedule[0].principalAmount);
    });
  });
  
  describe('Payment Frequency Validation', () => {
    
    test('should correctly convert annual rate to periodic rate', () => {
      const testCases = [
        { frequency: 'monthly', expectedPeriods: 12 },
        { frequency: 'fortnightly', expectedPeriods: 26 },
        { frequency: 'weekly', expectedPeriods: 52 }
      ];
      
      testCases.forEach(testCase => {
        const inputs = {
          loanAmount: 20000,
          interestRate: 6.0,
          loanTerm: 2,
          repaymentFrequency: testCase.frequency,
          hasResidualPayment: false,
          residualPayment: 0
        };
        
        const result = calculateLoanRepayments(inputs);
        
        expect(result.periodsPerYear).toBe(testCase.expectedPeriods);
        expect(result.totalPeriods).toBe(testCase.expectedPeriods * 2); // 2 years
      });
    });
  });
});

// Performance test
describe('Performance Tests', () => {
  
  test('should calculate large amortization schedule quickly', () => {
    const inputs = {
      loanAmount: 500000,
      interestRate: 4.5,
      loanTerm: 7, // Maximum term
      repaymentFrequency: 'weekly', // Maximum frequency
      hasResidualPayment: false,
      residualPayment: 0
    };
    
    const startTime = Date.now();
    const calculations = calculateLoanRepayments(inputs);
    const schedule = generateAmortizationSchedule(inputs, calculations);
    const endTime = Date.now();
    
    expect(schedule).toHaveLength(364); // 7 years × 52 weeks
    expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
  });
}); 
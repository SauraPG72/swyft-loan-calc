// Extracted Loan Calculator Logic for Testing
// This module contains the core calculation functions from your React component

function calculateLoanRepayments(inputs) {
  const { loanAmount, interestRate, loanTerm, repaymentFrequency, hasResidualPayment, residualPayment } = inputs;
  
  // Basic validation
  if (loanAmount <= 0 || interestRate < 0 || loanTerm <= 0) {
    return null;
  }
  
  // Determine periods per year based on frequency
  const periodsPerYear = repaymentFrequency === "weekly" ? 52 : repaymentFrequency === "fortnightly" ? 26 : 12;
  
  // Calculate periodic interest rate
  const periodicRate = interestRate / 100 / periodsPerYear;
  
  // Calculate total number of payments
  const totalPeriods = loanTerm * periodsPerYear;
  
  // Principal amount to be amortized (loan amount minus residual)
  const actualResidual = hasResidualPayment ? residualPayment : 0;
  const principalToAmortize = loanAmount - actualResidual;
  
  if (periodicRate === 0) {
    // Handle case where interest rate is 0%
    const repaymentPerPeriod = principalToAmortize / totalPeriods;
    const totalAmountPayable = principalToAmortize + actualResidual;
    
    return {
      repaymentPerPeriod,
      totalAmountPayable,
      totalInterest: 0,
      periodsPerYear,
      totalPeriods,
    };
  }
  
  // PMT formula: PMT = [P × r × (1 + r)^n] / [(1 + r)^n – 1]
  const powerTerm = Math.pow(1 + periodicRate, totalPeriods);
  const repaymentPerPeriod = (principalToAmortize * periodicRate * powerTerm) / (powerTerm - 1);
  
  // Total amount payable includes all payments plus residual
  const totalAmountPayable = repaymentPerPeriod * totalPeriods + actualResidual;
  const totalInterest = totalAmountPayable - loanAmount;
  
  return {
    repaymentPerPeriod,
    totalAmountPayable,
    totalInterest,
    periodsPerYear,
    totalPeriods,
  };
}

function generateAmortizationSchedule(inputs, calculationResults) {
  if (!calculationResults) return [];
  
  const { loanAmount, interestRate, hasResidualPayment, residualPayment } = inputs;
  const { repaymentPerPeriod, totalPeriods, periodsPerYear } = calculationResults;
  
  const periodicRate = interestRate / 100 / periodsPerYear;
  const actualResidual = hasResidualPayment ? residualPayment : 0;
  const principalToAmortize = loanAmount - actualResidual;
  
  const schedule = [];
  let remainingBalance = principalToAmortize;
  
  for (let paymentNumber = 1; paymentNumber <= totalPeriods; paymentNumber++) {
    const interestAmount = remainingBalance * periodicRate;
    const principalAmount = repaymentPerPeriod - interestAmount;
    
    // Handle final payment to avoid rounding errors
    if (paymentNumber === totalPeriods) {
      const adjustedPrincipal = remainingBalance;
      const adjustedPayment = adjustedPrincipal + interestAmount;
      
      schedule.push({
        paymentNumber,
        paymentAmount: adjustedPayment,
        principalAmount: adjustedPrincipal,
        interestAmount,
        remainingBalance: 0,
      });
    } else {
      remainingBalance -= principalAmount;
      
      schedule.push({
        paymentNumber,
        paymentAmount: repaymentPerPeriod,
        principalAmount,
        interestAmount,
        remainingBalance: Math.max(0, remainingBalance),
      });
    }
  }
  
  // Add balloon payment if applicable
  if (hasResidualPayment && residualPayment > 0) {
    schedule.push({
      paymentNumber: totalPeriods + 1,
      paymentAmount: residualPayment,
      principalAmount: residualPayment,
      interestAmount: 0,
      remainingBalance: 0,
    });
  }
  
  return schedule;
}

module.exports = {
  calculateLoanRepayments,
  generateAmortizationSchedule
}; 
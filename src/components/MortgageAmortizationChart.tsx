import React, { useState, useEffect } from 'react';

interface AmortizationChartProps {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  monthlyOverpayment?: number;
}

interface YearlyPaymentData {
  year: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  yearlyPrincipalPaid: number;
  yearlyInterestPaid: number;
  totalInterestRemaining: number;
  totalPrincipalRemaining: number;
  // Add next year's payments
  nextYearPrincipalPayment: number;
  nextYearInterestPayment: number;
}

export function MortgageAmortizationChart({ 
  loanAmount, 
  interestRate, 
  loanTerm,
  monthlyOverpayment = 0
}: AmortizationChartProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyPaymentData[]>([]);
  const [totalAmountToBePaid, setTotalAmountToBePaid] = useState<number>(0);
  
  // Calculate amortization data whenever inputs change
  useEffect(() => {
    const data = calculateAmortizationData();
    setYearlyData(data);
    
    // Get the total amount (principal + interest) to be paid
    const totalAmount = data[0].totalPrincipalRemaining + data[0].totalInterestRemaining;
    setTotalAmountToBePaid(totalAmount);
  }, [loanAmount, interestRate, loanTerm, monthlyOverpayment]);
  
  // Calculate amortization data
  const calculateAmortizationData = () => {
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = loanTerm * 12;
    
    let monthlyPayment = 0;
    if (monthlyRate > 0) {
      monthlyPayment = loanAmount * 
        (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
        (Math.pow(1 + monthlyRate, totalPayments) - 1);
    } else {
      monthlyPayment = loanAmount / totalPayments;
    }
    
    // Calculate total interest over the life of the loan without overpayments
    const totalInterestNoOverpayment = (monthlyPayment * totalPayments) - loanAmount;
    
    // Calculate yearly payment data
    const yearlyData: YearlyPaymentData[] = [];
    let remainingBalance = loanAmount;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    
    // Calculate payment data for each year
    const yearlyPayments: Array<{principal: number, interest: number}> = [];
    
    // Pre-calculate yearly payments for the entire term
    for (let year = 1; year <= loanTerm; year++) {
      let yearlyPrincipalPaid = 0;
      let yearlyInterestPaid = 0;
      let currentBalance = remainingBalance;
      
      // Skip if loan is already paid off
      if (currentBalance <= 0) {
        yearlyPayments.push({ principal: 0, interest: 0 });
        continue;
      }
      
      for (let month = 1; month <= 12; month++) {
        // Skip if loan is already paid off
        if (currentBalance <= 0) {
          break;
        }
        
        // Calculate interest for this month
        const interestPayment = currentBalance * monthlyRate;
        
        // Calculate principal for this month (regular payment minus interest)
        let principalPayment = monthlyPayment - interestPayment;
        
        // Add overpayment if specified
        if (monthlyOverpayment > 0) {
          principalPayment += monthlyOverpayment;
        }
        
        // Ensure we don't overpay
        if (principalPayment > currentBalance) {
          yearlyInterestPaid += interestPayment;
          yearlyPrincipalPaid += currentBalance;
          currentBalance = 0;
          break;
        }
        
        yearlyPrincipalPaid += principalPayment;
        yearlyInterestPaid += interestPayment;
        currentBalance -= principalPayment;
      }
      
      yearlyPayments.push({ 
        principal: yearlyPrincipalPaid, 
        interest: yearlyInterestPaid 
      });
    }
    
    // Add initial state (year 1) - beginning of year values
    yearlyData.push({
      year: 1,
      principalPaid: 0,
      interestPaid: 0,
      remainingBalance: loanAmount,
      yearlyPrincipalPaid: 0,
      yearlyInterestPaid: 0,
      totalInterestRemaining: totalInterestNoOverpayment,
      totalPrincipalRemaining: loanAmount,
      nextYearPrincipalPayment: yearlyPayments[0].principal,
      nextYearInterestPayment: yearlyPayments[0].interest
    });
    
    // Track if loan is fully paid
    let isLoanPaid = false;
    
    // Only go up to loanTerm - 1 to adjust the x-axis
    for (let year = 1; year < loanTerm; year++) {
      // Skip if loan is already paid off
      if (isLoanPaid) {
        yearlyData.push({
          year: year + 1,
          principalPaid: loanAmount,
          interestPaid: totalInterestPaid,
          remainingBalance: 0,
          yearlyPrincipalPaid: 0,
          yearlyInterestPaid: 0,
          totalPrincipalRemaining: 0,
          totalInterestRemaining: 0,
          nextYearPrincipalPayment: 0,
          nextYearInterestPayment: 0
        });
        continue;
      }
      
      let yearlyPrincipalPaid = 0;
      let yearlyInterestPaid = 0;
      
      for (let month = 1; month <= 12; month++) {
        // Skip if loan is already paid off
        if (remainingBalance <= 0) {
          isLoanPaid = true;
          break;
        }
        
        // Calculate interest for this month
        const interestPayment = remainingBalance * monthlyRate;
        
        // Calculate principal for this month (regular payment minus interest)
        let principalPayment = monthlyPayment - interestPayment;
        
        // Add overpayment if specified
        if (monthlyOverpayment > 0) {
          principalPayment += monthlyOverpayment;
        }
        
        // Ensure we don't overpay
        if (principalPayment > remainingBalance) {
          // Adjust the final payment
          yearlyInterestPaid += interestPayment;
          yearlyPrincipalPaid += remainingBalance;
          remainingBalance = 0;
          isLoanPaid = true;
          break;
        }
        
        yearlyPrincipalPaid += principalPayment;
        yearlyInterestPaid += interestPayment;
        remainingBalance -= principalPayment;
      }
      
      totalPrincipalPaid += yearlyPrincipalPaid;
      totalInterestPaid += yearlyInterestPaid;
      
      // Calculate remaining interest based on current balance and remaining term
      let remainingInterest = 0;
      if (remainingBalance > 0) {
        const remainingMonths = totalPayments - (year * 12);
        if (remainingMonths > 0 && monthlyRate > 0) {
          const newMonthlyPayment = remainingBalance * 
            (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / 
            (Math.pow(1 + monthlyRate, remainingMonths) - 1);
          remainingInterest = (newMonthlyPayment * remainingMonths) - remainingBalance;
        }
      }
      
      // Add data for the beginning of next year (year + 1)
      yearlyData.push({
        year: year + 1,
        principalPaid: totalPrincipalPaid,
        interestPaid: totalInterestPaid,
        remainingBalance,
        yearlyPrincipalPaid,
        yearlyInterestPaid,
        totalPrincipalRemaining: remainingBalance,
        totalInterestRemaining: remainingInterest,
        nextYearPrincipalPayment: year < loanTerm ? yearlyPayments[year].principal : 0,
        nextYearInterestPayment: year < loanTerm ? yearlyPayments[year].interest : 0
      });
      
      // If loan is paid off, fill the rest of the years with zeros
      if (isLoanPaid && year < loanTerm - 1) {
        for (let y = year + 1; y < loanTerm; y++) {
          yearlyData.push({
            year: y + 1,
            principalPaid: loanAmount,
            interestPaid: totalInterestPaid,
            remainingBalance: 0,
            yearlyPrincipalPaid: 0,
            yearlyInterestPaid: 0,
            totalPrincipalRemaining: 0,
            totalInterestRemaining: 0,
            nextYearPrincipalPayment: 0,
            nextYearInterestPayment: 0
          });
        }
        break;
      }
    }
    
    return yearlyData;
  };
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  if (yearlyData.length === 0) {
    return <div>Loading chart...</div>;
  }
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Mortgage Balance Over Time</h3>
      
      <div className="relative h-80 mt-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-gray-500">
          <div>{formatCurrency(totalAmountToBePaid)}</div>
          <div>{formatCurrency(totalAmountToBePaid * 0.75)}</div>
          <div>{formatCurrency(totalAmountToBePaid * 0.5)}</div>
          <div>{formatCurrency(totalAmountToBePaid * 0.25)}</div>
          <div>£0</div>
        </div>
        
        {/* Chart area */}
        <div className="absolute left-16 right-0 top-0 bottom-8">
          {/* Horizontal grid lines */}
          <div className="absolute left-0 right-0 top-0 h-px bg-gray-200"></div>
          <div className="absolute left-0 right-0 top-1/4 h-px bg-gray-200"></div>
          <div className="absolute left-0 right-0 top-2/4 h-px bg-gray-200"></div>
          <div className="absolute left-0 right-0 top-3/4 h-px bg-gray-200"></div>
          <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-200"></div>
          
          {/* Stacked bars for remaining balance */}
          <div className="absolute inset-0 flex items-end">
            {yearlyData.map((data, index) => {
              const barWidth = `${100 / (yearlyData.length)}%`;
              const totalRemaining = data.totalPrincipalRemaining + data.totalInterestRemaining;
              const totalBarHeight = `${(totalRemaining / totalAmountToBePaid) * 100}%`;
              
              // Calculate percentages safely to avoid NaN or division by zero
              let principalPercentage = 0;
              let interestPercentage = 0;
              
              if (totalRemaining > 0) {
                principalPercentage = (data.totalPrincipalRemaining / totalRemaining) * 100;
                interestPercentage = (data.totalInterestRemaining / totalRemaining) * 100;
              }
              
              return (
                <div 
                  key={index} 
                  className="flex flex-col items-center justify-end h-full"
                  style={{ width: barWidth }}
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <div 
                    className="w-4/5 relative flex flex-col justify-end"
                    style={{ height: totalBarHeight }}
                  >
                    {/* Interest portion - on top */}
                    <div 
                      className="w-full bg-sunset-middle/80"
                      style={{ height: `${interestPercentage}%` }}
                    ></div>
                    
                    {/* Principal portion - on bottom */}
                    <div 
                      className="w-full bg-sunset-start/80"
                      style={{ height: `${principalPercentage}%` }}
                    ></div>
                    
                    {hoveredBar === index && (
                      <div className="absolute -top-28 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        <div className="font-semibold mb-1">Year {data.year}</div>
                        <div>Total remaining: {formatCurrency(totalRemaining)}</div>
                        <div>Principal remaining: {formatCurrency(data.totalPrincipalRemaining)}</div>
                        <div>Interest remaining: {formatCurrency(data.totalInterestRemaining)}</div>
                        
                        {/* Show payments for the upcoming year */}
                        {data.nextYearPrincipalPayment > 0 && (
                          <div className="mt-1 pt-1 border-t border-white/20">
                            <div className="font-semibold text-sunset-start">Payments in Year {data.year}:</div>
                            <div>Principal: {formatCurrency(data.nextYearPrincipalPayment)}</div>
                            <div>Interest: {formatCurrency(data.nextYearInterestPayment)}</div>
                            <div>Total: {formatCurrency(data.nextYearPrincipalPayment + data.nextYearInterestPayment)}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Year number label */}
                  <div className="absolute bottom-0 transform translate-y-full text-xs text-gray-500 mt-1">
                    {data.year}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* X-axis label */}
        <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-500 mt-6">
          Year
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center mt-12 space-x-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-sunset-middle/80 mr-2"></div>
          <span className="text-sm text-gray-700">Interest Remaining</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-sunset-start/80 mr-2"></div>
          <span className="text-sm text-gray-700">Principal Remaining</span>
        </div>
      </div>
    </div>
  );
}
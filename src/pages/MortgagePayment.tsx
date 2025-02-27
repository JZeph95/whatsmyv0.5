import React, { useState, useEffect, useRef } from 'react';
import { Home } from 'lucide-react';
import { MortgageAmortizationChart } from '../components/MortgageAmortizationChart';

interface MortgageFormData {
  homePrice: number;
  downPayment: number;
  loanTerm: number;
  interestRate: number;
  monthlyOverpayment: number;
}

interface MortgageResults {
  monthlyPayment: number;
  principalAndInterest: number;
  totalPayment: number;
  totalInterest: number;
  loanAmount: number;
  // Overpayment results
  totalInterestWithOverpayment: number;
  interestSaved: number;
  newLoanTermMonths: number;
  monthsReduced: number;
  // Interest rate scenarios
  higherRatePayment: number;
  lowerRatePayment: number;
}

interface InputFieldState {
  homePrice: string;
  downPayment: string;
  loanTerm: string;
  interestRate: string;
  monthlyOverpayment: string;
  downPaymentPercent: string;
}

export function MortgagePayment() {
  // Use numeric values for calculations
  const [formData, setFormData] = useState<MortgageFormData>({
    homePrice: 250000,
    downPayment: 25000,
    loanTerm: 25,
    interestRate: 4.5,
    monthlyOverpayment: 0
  });

  // Use string values for input fields to handle empty state better
  const [inputValues, setInputValues] = useState<InputFieldState>({
    homePrice: '250,000',
    downPayment: '25,000',
    loanTerm: '25',
    interestRate: '4.5',
    monthlyOverpayment: '0',
    downPaymentPercent: '10'
  });

  const [results, setResults] = useState<MortgageResults | null>(null);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(10);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  
  // Track if field is being edited
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Store cursor position for formatted inputs
  const cursorPositionRef = useRef<number | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({
    homePrice: null,
    downPayment: null,
    monthlyOverpayment: null
  });

  // Calculate mortgage payment when form data changes
  useEffect(() => {
    calculateMortgage();
  }, [formData]);

  // Update deposit amount when percentage changes
  useEffect(() => {
    if (focusedField === 'downPaymentPercent') {
      // Calculate new down payment based on percentage (capped at 100%)
      const cappedPercentage = Math.min(downPaymentPercent, 100);
      const newDownPayment = Math.round(formData.homePrice * (cappedPercentage / 100));
      
      setFormData({
        ...formData,
        downPayment: newDownPayment
      });
      
      setInputValues({
        ...inputValues,
        downPayment: formatNumberWithCommas(newDownPayment)
      });
    }
  }, [downPaymentPercent, formData.homePrice, focusedField]);

  // Update deposit percentage when amount changes
  useEffect(() => {
    if (focusedField === 'downPayment') {
      // Ensure down payment doesn't exceed home price
      const cappedDownPayment = Math.min(formData.downPayment, formData.homePrice);
      
      if (cappedDownPayment !== formData.downPayment) {
        setFormData({
          ...formData,
          downPayment: cappedDownPayment
        });
        
        setInputValues({
          ...inputValues,
          downPayment: formatNumberWithCommas(cappedDownPayment)
        });
      }
      
      const newPercent = (cappedDownPayment / formData.homePrice) * 100;
      if (Math.abs(newPercent - downPaymentPercent) > 0.1) {
        setDownPaymentPercent(Number(newPercent.toFixed(1)));
        setInputValues({
          ...inputValues,
          downPaymentPercent: newPercent.toFixed(1)
        });
      }
    }
  }, [formData.downPayment, formData.homePrice, focusedField]);

  // Update deposit amount when home price changes
  useEffect(() => {
    if (focusedField === 'homePrice') {
      const newDownPayment = Math.round(formData.homePrice * (downPaymentPercent / 100));
      setFormData({
        ...formData,
        downPayment: newDownPayment
      });
      setInputValues({
        ...inputValues,
        downPayment: formatNumberWithCommas(newDownPayment)
      });
    }
  }, [formData.homePrice, downPaymentPercent, focusedField]);

  // Format a number with commas as thousands separators
  const formatNumberWithCommas = (value: number | string): string => {
    // Convert to string and remove any existing commas
    const numStr = value.toString().replace(/,/g, '');
    
    // Check if it's a valid number
    if (isNaN(Number(numStr))) return numStr;
    
    // Format with commas
    return Number(numStr).toLocaleString('en-GB');
  };

  // Parse a string with commas to a number
  const parseFormattedNumber = (value: string): number => {
    // Remove commas and convert to number
    return Number(value.replace(/,/g, ''));
  };

  // Calculate cursor position after formatting
  const calculateCursorPosition = (
    value: string,
    oldValue: string,
    oldPosition: number | null,
    newValue: string
  ): number => {
    if (oldPosition === null) return newValue.length;
    
    // Count commas before cursor in the old value
    const oldCommasBefore = (oldValue.substring(0, oldPosition).match(/,/g) || []).length;
    
    // Count digits before cursor in the old value
    const oldDigitsBefore = oldPosition - oldCommasBefore;
    
    // Count commas in the new value up to the same number of digits
    let newCommasBefore = 0;
    let newDigitsCounted = 0;
    let newPosition = 0;
    
    for (let i = 0; i < newValue.length; i++) {
      if (newValue[i] !== ',') {
        newDigitsCounted++;
      } else {
        newCommasBefore++;
      }
      
      if (newDigitsCounted === oldDigitsBefore) {
        newPosition = i + 1;
        break;
      }
    }
    
    // If we didn't reach the same number of digits, put cursor at the end
    if (newDigitsCounted < oldDigitsBefore) {
      newPosition = newValue.length;
    }
    
    return newPosition;
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFocusedField(name);
    
    // If the value is "0" or "0,000", clear it when the user focuses on the field
    if (value === '0' || value === '0,000') {
      setInputValues({
        ...inputValues,
        [name]: ''
      });
    }
    
    // Store current cursor position
    cursorPositionRef.current = e.target.selectionStart;
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFocusedField(null);
    
    // If the field is empty, set it back to "0" with appropriate formatting
    if (value === '') {
      const defaultValue = name === 'interestRate' ? '0.0' : '0';
      setInputValues({
        ...inputValues,
        [name]: defaultValue
      });
      
      // Update the numeric value for calculations
      setFormData({
        ...formData,
        [name]: 0
      });
    } else if (['homePrice', 'downPayment', 'monthlyOverpayment'].includes(name)) {
      // Ensure proper formatting on blur for numeric fields
      const numericValue = parseFormattedNumber(value);
      setInputValues({
        ...inputValues,
        [name]: formatNumberWithCommas(numericValue)
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Store current cursor position before update
    const cursorPos = e.target.selectionStart;
    cursorPositionRef.current = cursorPos;
    
    // Handle different input types
    if (['homePrice', 'downPayment', 'monthlyOverpayment'].includes(name)) {
      // For currency fields, only allow digits and commas
      const cleanValue = value.replace(/[^\d,]/g, '');
      
      // Remove existing commas for processing
      const numericString = cleanValue.replace(/,/g, '');
      
      if (numericString === '') {
        // Handle empty input
        setInputValues({
          ...inputValues,
          [name]: ''
        });
        return;
      }
      
      // Parse to number and format with commas
      const numericValue = Number(numericString);
      
      if (!isNaN(numericValue)) {
        const oldValue = inputValues[name as keyof InputFieldState];
        const formattedValue = formatNumberWithCommas(numericValue);
        
        // Update input value with formatted string
        setInputValues({
          ...inputValues,
          [name]: formattedValue
        });
        
        // For down payment, ensure it doesn't exceed home price
        if (name === 'downPayment') {
          const homePrice = formData.homePrice;
          const cappedValue = Math.min(numericValue, homePrice);
          
          // Update numeric value for calculations
          setFormData({
            ...formData,
            [name]: cappedValue
          });
        } else {
          // Update numeric value for calculations
          setFormData({
            ...formData,
            [name]: numericValue
          });
        }
        
        // Calculate new cursor position after formatting
        setTimeout(() => {
          const inputElement = inputRefs.current[name];
          if (inputElement) {
            const newCursorPos = calculateCursorPosition(
              cleanValue,
              oldValue,
              cursorPos,
              formattedValue
            );
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      }
    } else if (name === 'loanTerm') {
      // For loan term, only allow integers
      const cleanValue = value.replace(/[^\d]/g, '');
      
      setInputValues({
        ...inputValues,
        [name]: cleanValue
      });
      
      if (cleanValue !== '') {
        const numericValue = parseInt(cleanValue, 10);
        setFormData({
          ...formData,
          [name]: numericValue
        });
      }
    } else if (name === 'interestRate') {
      // For interest rate, allow decimals
      const cleanValue = value.replace(/[^\d.]/g, '');
      
      // Ensure only one decimal point
      const parts = cleanValue.split('.');
      const formattedValue = parts.length > 1 
        ? `${parts[0]}.${parts.slice(1).join('')}`
        : cleanValue;
      
      setInputValues({
        ...inputValues,
        [name]: formattedValue
      });
      
      if (formattedValue !== '' && formattedValue !== '.') {
        const numericValue = parseFloat(formattedValue);
        setFormData({
          ...formData,
          [name]: numericValue
        });
      }
    } else {
      // For other fields, use standard handling
      setInputValues({
        ...inputValues,
        [name]: value
      });
      
      if (value !== '') {
        let parsedValue: number;
        
        if (name === 'loanTerm') {
          parsedValue = parseInt(value, 10) || 0;
        } else {
          parsedValue = parseFloat(value) || 0;
        }
        
        setFormData({
          ...formData,
          [name]: parsedValue
        });
      }
    }
  };

  const handlePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Update the input value
    setInputValues({
      ...inputValues,
      downPaymentPercent: value
    });
    
    // Only update the numeric value if the input is not empty
    if (value !== '') {
      // Cap the percentage at 100%
      const parsedValue = parseFloat(value) || 0;
      const cappedValue = Math.min(parsedValue, 100);
      
      setDownPaymentPercent(cappedValue);
      
      // If the input was capped, update the input field to show the capped value
      if (cappedValue !== parsedValue) {
        setInputValues({
          ...inputValues,
          downPaymentPercent: cappedValue.toString()
        });
      }
    }
  };

  // Calculate monthly payment for a given interest rate
  const calculateMonthlyPayment = (
    loanAmount: number,
    interestRate: number,
    loanTermYears: number
  ): number => {
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTermYears * 12;
    
    if (monthlyRate <= 0) {
      return loanAmount / numberOfPayments;
    }
    
    return loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  };

  const calculateMortgage = () => {
    setIsCalculating(true);
    
    // Short delay to show calculation animation if needed
    setTimeout(() => {
      try {
        const loanAmount = formData.homePrice - formData.downPayment;
        const monthlyInterestRate = formData.interestRate / 100 / 12;
        const numberOfPayments = formData.loanTerm * 12;
        
        // Calculate principal and interest payment
        let principalAndInterest = 0;
        if (monthlyInterestRate > 0) {
          principalAndInterest = loanAmount * 
            (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
            (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
        } else {
          principalAndInterest = loanAmount / numberOfPayments;
        }
        
        // Calculate total monthly payment
        const totalMonthlyPayment = principalAndInterest;
        
        // Calculate total interest paid over the life of the loan
        const totalInterest = (principalAndInterest * numberOfPayments) - loanAmount;
        
        // Calculate with overpayment if applicable
        let totalInterestWithOverpayment = totalInterest;
        let interestSaved = 0;
        let newLoanTermMonths = numberOfPayments;
        let monthsReduced = 0;
        
        if (formData.monthlyOverpayment > 0) {
          // Calculate new loan term and interest with overpayment
          const { totalInterest: newTotalInterest, months: newMonths } = calculateWithOverpayment(
            loanAmount,
            monthlyInterestRate,
            principalAndInterest,
            formData.monthlyOverpayment,
            numberOfPayments
          );
          
          totalInterestWithOverpayment = newTotalInterest;
          interestSaved = totalInterest - newTotalInterest;
          newLoanTermMonths = newMonths;
          monthsReduced = numberOfPayments - newMonths;
        }
        
        // Calculate payments with higher and lower interest rates
        const higherRate = formData.interestRate + 1;
        const lowerRate = Math.max(0, formData.interestRate - 1); // Ensure rate doesn't go below 0
        
        const higherRatePayment = calculateMonthlyPayment(loanAmount, higherRate, formData.loanTerm);
        const lowerRatePayment = calculateMonthlyPayment(loanAmount, lowerRate, formData.loanTerm);
        
        setResults({
          monthlyPayment: totalMonthlyPayment,
          principalAndInterest: principalAndInterest,
          totalPayment: totalMonthlyPayment * numberOfPayments,
          totalInterest: totalInterest,
          loanAmount: loanAmount,
          totalInterestWithOverpayment,
          interestSaved,
          newLoanTermMonths,
          monthsReduced,
          higherRatePayment,
          lowerRatePayment
        });
      } catch (error) {
        console.error("Error calculating mortgage:", error);
      } finally {
        setIsCalculating(false);
      }
    }, 300);
  };

  // Calculate mortgage with overpayment
  const calculateWithOverpayment = (
    loanAmount: number,
    monthlyInterestRate: number,
    regularPayment: number,
    overpayment: number,
    originalTermMonths: number
  ) => {
    let balance = loanAmount;
    let month = 0;
    let totalInterest = 0;
    
    // Continue until balance is paid off or original term is reached
    while (balance > 0 && month < originalTermMonths) {
      // Calculate interest for this month
      const interestThisMonth = balance * monthlyInterestRate;
      totalInterest += interestThisMonth;
      
      // Calculate principal for this month (regular payment minus interest)
      let principalThisMonth = regularPayment - interestThisMonth;
      
      // Add overpayment
      principalThisMonth += overpayment;
      
      // Reduce balance by principal payment
      balance -= principalThisMonth;
      
      // If balance would go negative, adjust the final payment
      if (balance < 0) {
        // Add the excess payment back to the total interest (since it wasn't actually paid)
        totalInterest += balance * -1;
        balance = 0;
      }
      
      month++;
    }
    
    return {
      totalInterest,
      months: month
    };
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format years and months with abbreviated units
  const formatPeriod = (months: number): string => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${remainingMonths} mth${remainingMonths !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
      return `${years} yr${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} yr${years !== 1 ? 's' : ''} ${remainingMonths} mth${remainingMonths !== 1 ? 's' : ''}`;
    }
  };

  return (
    <main className="pt-24 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sunset-start via-sunset-middle to-sunset-end flex items-center justify-center mb-6">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Mortgage Payment Calculator</h1>
          <p className="text-gray-600 text-center max-w-2xl">
            Calculate your monthly mortgage payment based on property price, deposit, interest rate and term.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Calculator Form */}
          <div className="md:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl p-6 gradient-border">
            <h2 className="text-xl font-semibold mb-4">Mortgage Details</h2>
            
            <div className="space-y-4">
              {/* Home Price */}
              <div>
                <label htmlFor="homePrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Price
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">£</span>
                  <input
                    ref={(el) => inputRefs.current.homePrice = el}
                    type="text"
                    inputMode="numeric"
                    id="homePrice"
                    name="homePrice"
                    value={inputValues.homePrice}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="block w-full pl-8 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                  />
                </div>
              </div>
              
              {/* Deposit */}
              <div>
                <label htmlFor="downPayment" className="block text-sm font-medium text-gray-700 mb-1">
                  Deposit
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">£</span>
                    <input
                      ref={(el) => inputRefs.current.downPayment = el}
                      type="text"
                      inputMode="numeric"
                      id="downPayment"
                      name="downPayment"
                      value={inputValues.downPayment}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                      style={{ minWidth: "100%", width: "100%" }}
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      id="downPaymentPercent"
                      name="downPaymentPercent"
                      value={inputValues.downPaymentPercent}
                      onChange={handlePercentChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
                  </div>
                </div>
                {downPaymentPercent >= 100 && (
                  <p className="text-xs text-sunset-text mt-1">
                    Note: Deposit is set to 100% of the property price.
                  </p>
                )}
              </div>
              
              {/* Loan Term */}
              <div>
                <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700 mb-1">
                  Mortgage Term (years)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    id="loanTerm"
                    name="loanTerm"
                    value={inputValues.loanTerm}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">years</span>
                </div>
              </div>
              
              {/* Interest Rate */}
              <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Rate
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    id="interestRate"
                    name="interestRate"
                    value={inputValues.interestRate}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
                </div>
              </div>
              
              {/* Monthly Overpayment */}
              <div>
                <label htmlFor="monthlyOverpayment" className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Overpayment (optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">£</span>
                  <input
                    ref={(el) => inputRefs.current.monthlyOverpayment = el}
                    type="text"
                    inputMode="numeric"
                    id="monthlyOverpayment"
                    name="monthlyOverpayment"
                    value={inputValues.monthlyOverpayment}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="block w-full pl-8 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Adding a regular overpayment can significantly reduce your interest costs and mortgage term.
                </p>
              </div>
              
              {/* Calculate Button */}
              <div className="mt-6">
                <button
                  onClick={calculateMortgage}
                  disabled={isCalculating || formData.downPayment >= formData.homePrice}
                  className={`w-full gradient-button text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-lg ${
                    formData.downPayment >= formData.homePrice ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isCalculating ? 'Calculating...' : 'Calculate Mortgage Payment'}
                </button>
                {formData.downPayment >= formData.homePrice && (
                  <p className="text-sm text-sunset-text mt-2 text-center">
                    Deposit cannot be equal to or greater than the property price.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Results Panel */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 gradient-border">
            <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
            
            {results ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-sunset-start/10 to-sunset-end/10 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Monthly Payment</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formData.monthlyOverpayment > 0 
                      ? formatCurrency(results.monthlyPayment + formData.monthlyOverpayment)
                      : formatCurrency(results.monthlyPayment)
                    }
                  </p>
                  {formData.monthlyOverpayment > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      incl. {formatCurrency(formData.monthlyOverpayment)} overpayment
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Principal & Interest</p>
                    <p className="text-sm font-medium">{formatCurrency(results.principalAndInterest)}</p>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-700">Loan Amount</p>
                    <p className="text-sm font-medium">{formatCurrency(results.loanAmount)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-700">Total Interest</p>
                    <p className="text-sm font-medium">{formatCurrency(results.totalInterest)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-700">Total Cost</p>
                    <p className="text-sm font-medium">{formatCurrency(results.totalPayment)}</p>
                  </div>
                  
                  {/* Interest Rate Scenarios */}
                  <div className="border-t border-gray-200 my-3"></div>
                  <div className="bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg p-3">
                    <h3 className="text-sm font-semibold mb-2">Interest Rate Scenarios</h3>
                    
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-gray-600">If rates drop by 1%</p>
                      <p className="text-sm font-medium text-sunset-text">
                        {formatCurrency(results.lowerRatePayment + formData.monthlyOverpayment)}
                      </p>
                    </div>
                    
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-600">If rates rise by 1%</p>
                      <p className="text-sm font-medium text-sunset-text-hover">
                        {formatCurrency(results.higherRatePayment + formData.monthlyOverpayment)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Overpayment Results */}
                  {formData.monthlyOverpayment > 0 && (
                    <>
                      <div className="border-t border-gray-200 my-3"></div>
                      <div className="bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg p-3">
                        <h3 className="text-sm font-semibold mb-2">With Overpayments</h3>
                        
                        <div className="flex justify-between mb-1">
                          <p className="text-sm text-gray-600">New Mortgage Term</p>
                          <p className="text-sm font-medium">{formatPeriod(results.newLoanTermMonths)}</p>
                        </div>
                        
                        <div className="flex justify-between mb-1">
                          <p className="text-sm text-gray-600">Time Saved</p>
                          <p className="text-sm font-medium text-sunset-text">{formatPeriod(results.monthsReduced)}</p>
                        </div>
                        
                        <div className="flex justify-between">
                          <p className="text-sm text-gray-600">Interest Saved</p>
                          <p className="text-sm font-medium text-sunset-text">{formatCurrency(results.interestSaved)}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-gray-500 mb-2">Enter your mortgage details and click calculate to see your payment breakdown.</p>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sunset-start/20 via-sunset-middle/20 to-sunset-end/20 flex items-center justify-center mt-4">
                  <Home className="w-6 h-6 text-sunset-middle opacity-60" />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Amortization Chart - Hidden on mobile */}
        {results && (
          <div className="hidden md:block mt-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 gradient-border">
            <MortgageAmortizationChart 
              loanAmount={results.loanAmount} 
              interestRate={formData.interestRate} 
              loanTerm={formData.loanTerm}
              monthlyOverpayment={formData.monthlyOverpayment}
            />
            
            {formData.monthlyOverpayment > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-sunset-start mr-2"></div>
                  <p className="text-sm text-gray-700">
                    With your monthly overpayment of {formatCurrency(formData.monthlyOverpayment)}, 
                    you could pay off your mortgage {formatPeriod(results.monthsReduced)} earlier 
                    and save {formatCurrency(results.interestSaved)} in interest.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Mobile-only summary of overpayment benefits */}
        {results && formData.monthlyOverpayment > 0 && (
          <div className="md:hidden mt-6 bg-white/80 backdrop-blur-sm rounded-xl p-4 gradient-border">
            <div className="p-4 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg">
              <h3 className="text-sm font-semibold mb-2">Overpayment Benefits</h3>
              <p className="text-sm text-gray-700">
                With your monthly overpayment of {formatCurrency(formData.monthlyOverpayment)}, 
                you could pay off your mortgage {formatPeriod(results.monthsReduced)} earlier 
                and save {formatCurrency(results.interestSaved)} in interest.
              </p>
            </div>
          </div>
        )}
        
        {/* Additional Information */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 gradient-border">
          <h2 className="text-xl font-semibold mb-4">Understanding Your Mortgage Payment</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              Your monthly mortgage payment consists of two main components:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Principal:</strong> The amount that goes toward paying off your loan balance.</li>
              <li><strong>Interest:</strong> The cost of borrowing money, calculated as a percentage of your loan balance.</li>
            </ul>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">Benefits of Overpayments</h3>
            <p>
              Making regular overpayments on your mortgage can have significant benefits:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Reduce your term:</strong> Pay off your mortgage earlier and become debt-free sooner.</li>
              <li><strong>Save on interest:</strong> Reduce the total interest paid over the life of your mortgage.</li>
              <li><strong>Build equity faster:</strong> Increase your ownership stake in your property more quickly.</li>
              <li><strong>Flexibility:</strong> Most UK mortgages allow overpayments of up to 10% of the outstanding balance each year without penalties.</li>
            </ul>
            
            <div className="bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg p-4 mt-4">
              <p className="text-sm">
                <strong>Important:</strong> Always check with your lender about any restrictions or early repayment charges that may apply to overpayments.
              </p>
            </div>
            
            <p className="mt-4">
              This calculator provides an estimate of your monthly payment based on the information you provide. Actual payments may vary based on your specific loan terms and lender requirements.
            </p>
            <p>
              In the UK, you may also need to consider:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Arrangement fees:</strong> One-time fees charged by lenders to set up your mortgage.</li>
              <li><strong>Valuation fees:</strong> Costs for the lender to assess the property's value.</li>
              <li><strong>Solicitor fees:</strong> Legal costs for handling the property purchase.</li>
              <li><strong>Stamp Duty Land Tax:</strong> A tax paid when buying property over a certain value.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
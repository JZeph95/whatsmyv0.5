import React, { useState, useRef, useEffect } from 'react';
import { Car, PoundSterling, HelpCircle, PlusCircle, MinusCircle, Info } from 'lucide-react';

interface FormData {
  carPrice: number;
  deposit: number;
  loanTerm: number;
  interestRate: number;
  balloonPayment: number;
  financeType: string;
}

interface InputFieldState {
  carPrice: string;
  deposit: string;
  loanTerm: string;
  interestRate: string;
  balloonPayment: string;
  depositPercent: string;
  balloonPercent: string;
  financeType: string;
}

interface CarLoanResult {
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  loanAmount: number;
  balloonPayment: number;
  apr: number;
}

export function CarPayment() {
  // Default values for the calculator
  const [formData, setFormData] = useState<FormData>({
    carPrice: 20000,
    deposit: 2000,
    loanTerm: 48,
    interestRate: 6.9,
    balloonPayment: 0,
    financeType: 'hp'
  });

  // Input field values (as strings to handle formatting)
  const [inputValues, setInputValues] = useState<InputFieldState>({
    carPrice: '20,000',
    deposit: '2,000',
    loanTerm: '48',
    interestRate: '6.9',
    balloonPayment: '0',
    depositPercent: '10',
    balloonPercent: '0',
    financeType: 'hp'
  });

  const [results, setResults] = useState<CarLoanResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<string | null>(null);
  const [depositPercent, setDepositPercent] = useState<number>(10);
  const [balloonPercent, setBalloonPercent] = useState<number>(0);
  
  // Store cursor position for formatted inputs
  const cursorPositionRef = useRef<number | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({
    carPrice: null,
    deposit: null,
    balloonPayment: null,
    interestRate: null,
    loanTerm: null
  });

  // Calculate results when form data changes
  useEffect(() => {
    calculateCarLoan();
  }, [formData]);

  // Update deposit amount when percentage changes
  useEffect(() => {
    if (focusedField === 'depositPercent') {
      // Calculate new deposit based on percentage (capped at 100%)
      const cappedPercentage = Math.min(depositPercent, 100);
      const newDeposit = Math.round(formData.carPrice * (cappedPercentage / 100));
      
      setFormData({
        ...formData,
        deposit: newDeposit
      });
      
      setInputValues({
        ...inputValues,
        deposit: formatNumberWithCommas(newDeposit)
      });
    }
  }, [depositPercent, formData.carPrice, focusedField]);

  // Update deposit percentage when amount changes
  useEffect(() => {
    if (focusedField === 'deposit') {
      // Ensure deposit doesn't exceed car price
      const cappedDeposit = Math.min(formData.deposit, formData.carPrice);
      
      if (cappedDeposit !== formData.deposit) {
        setFormData({
          ...formData,
          deposit: cappedDeposit
        });
        
        setInputValues({
          ...inputValues,
          deposit: formatNumberWithCommas(cappedDeposit)
        });
      }
      
      const newPercent = (cappedDeposit / formData.carPrice) * 100;
      if (Math.abs(newPercent - depositPercent) > 0.1) {
        setDepositPercent(Number(newPercent.toFixed(1)));
        setInputValues({
          ...inputValues,
          depositPercent: newPercent.toFixed(1)
        });
      }
    }
  }, [formData.deposit, formData.carPrice, focusedField]);

  // Update deposit amount when car price changes
  useEffect(() => {
    if (focusedField === 'carPrice') {
      const newDeposit = Math.round(formData.carPrice * (depositPercent / 100));
      setFormData({
        ...formData,
        deposit: newDeposit
      });
      setInputValues({
        ...inputValues,
        deposit: formatNumberWithCommas(newDeposit)
      });
      
      // Also update balloon payment if PCP
      if (formData.financeType === 'pcp') {
        const newBalloon = Math.round(formData.carPrice * (balloonPercent / 100));
        setFormData({
          ...formData,
          balloonPayment: newBalloon
        });
        setInputValues({
          ...inputValues,
          balloonPayment: formatNumberWithCommas(newBalloon)
        });
      }
    }
  }, [formData.carPrice, depositPercent, balloonPercent, focusedField, formData.financeType]);

  // Update balloon amount when percentage changes
  useEffect(() => {
    if (focusedField === 'balloonPercent') {
      // Calculate new balloon based on percentage (capped at 60%)
      const cappedPercentage = Math.min(balloonPercent, 60);
      const newBalloon = Math.round(formData.carPrice * (cappedPercentage / 100));
      
      setFormData({
        ...formData,
        balloonPayment: newBalloon
      });
      
      setInputValues({
        ...inputValues,
        balloonPayment: formatNumberWithCommas(newBalloon)
      });
    }
  }, [balloonPercent, formData.carPrice, focusedField]);

  // Update balloon percentage when amount changes
  useEffect(() => {
    if (focusedField === 'balloonPayment') {
      // Ensure balloon doesn't exceed 60% of car price
      const maxBalloon = formData.carPrice * 0.6;
      const cappedBalloon = Math.min(formData.balloonPayment, maxBalloon);
      
      if (cappedBalloon !== formData.balloonPayment) {
        setFormData({
          ...formData,
          balloonPayment: cappedBalloon
        });
        
        setInputValues({
          ...inputValues,
          balloonPayment: formatNumberWithCommas(cappedBalloon)
        });
      }
      
      const newPercent = (cappedBalloon / formData.carPrice) * 100;
      if (Math.abs(newPercent - balloonPercent) > 0.1) {
        setBalloonPercent(Number(newPercent.toFixed(1)));
        setInputValues({
          ...inputValues,
          balloonPercent: newPercent.toFixed(1)
        });
      }
    }
  }, [formData.balloonPayment, formData.carPrice, focusedField]);

  // Handle finance type change
  useEffect(() => {
    if (formData.financeType === 'hp') {
      // Reset balloon payment for HP
      setFormData({
        ...formData,
        balloonPayment: 0
      });
      setInputValues({
        ...inputValues,
        balloonPayment: '0',
        balloonPercent: '0'
      });
      setBalloonPercent(0);
    } else if (formData.financeType === 'pcp' && formData.balloonPayment === 0) {
      // Set default balloon payment for PCP (30% of car price)
      const defaultBalloon = Math.round(formData.carPrice * 0.3);
      setFormData({
        ...formData,
        balloonPayment: defaultBalloon
      });
      setInputValues({
        ...inputValues,
        balloonPayment: formatNumberWithCommas(defaultBalloon),
        balloonPercent: '30'
      });
      setBalloonPercent(30);
    }
  }, [formData.financeType]);

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
    setShowInfo(null);
    
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
    } else if (['carPrice', 'deposit', 'balloonPayment'].includes(name)) {
      // Ensure proper formatting on blur for numeric fields
      const numericValue = parseFormattedNumber(value);
      setInputValues({
        ...inputValues,
        [name]: formatNumberWithCommas(numericValue)
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for select elements
    if (name === 'financeType') {
      setInputValues({
        ...inputValues,
        [name]: value
      });
      
      setFormData({
        ...formData,
        [name]: value
      });
      
      return;
    }
    
    // For input elements, store current cursor position before update
    if (e.target instanceof HTMLInputElement) {
      const cursorPos = e.target.selectionStart;
      cursorPositionRef.current = cursorPos;
    }
    
    // Handle different input types
    if (['carPrice', 'deposit', 'balloonPayment'].includes(name)) {
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
        
        // Update numeric value for calculations
        setFormData({
          ...formData,
          [name]: numericValue
        });
        
        // Calculate new cursor position after formatting
        if (e.target instanceof HTMLInputElement) {
          setTimeout(() => {
            const inputElement = inputRefs.current[name];
            if (inputElement) {
              const newCursorPos = calculateCursorPosition(
                cleanValue,
                oldValue,
                cursorPositionRef.current,
                formattedValue
              );
              inputElement.setSelectionRange(newCursorPos, newCursorPos);
            }
          }, 0);
        }
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
    } else if (name === 'depositPercent') {
      // For deposit percentage
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
        setDepositPercent(numericValue);
      }
    } else if (name === 'balloonPercent') {
      // For balloon percentage
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
        setBalloonPercent(numericValue);
      }
    } else {
      // For other fields, use standard handling
      setInputValues({
        ...inputValues,
        [name]: value
      });
      
      if (value !== '') {
        let parsedValue: number | string;
        
        if (name === 'loanTerm') {
          parsedValue = parseInt(value, 10) || 0;
        } else if (name === 'interestRate') {
          parsedValue = parseFloat(value) || 0;
        } else {
          parsedValue = value;
        }
        
        setFormData({
          ...formData,
          [name]: parsedValue
        });
      }
    }
  };

  const handleAdjustValue = (field: keyof FormData, increment: boolean) => {
    let currentValue = formData[field];
    let step = 1;
    
    // Use different step sizes for different fields
    if (field === 'carPrice') {
      step = 1000;
    } else if (field === 'deposit' || field === 'balloonPayment') {
      step = 500;
    } else if (field === 'interestRate') {
      step = 0.5;
    } else if (field === 'loanTerm') {
      step = 6; // 6 months
    }
    
    // Calculate new value
    const newValue = increment 
      ? currentValue + step 
      : Math.max(0, currentValue - step);
    
    // Update form data
    setFormData({
      ...formData,
      [field]: newValue
    });
    
    // Update input value with formatting
    let formattedValue: string;
    if (field === 'interestRate') {
      formattedValue = newValue.toString();
    } else {
      formattedValue = formatNumberWithCommas(newValue);
    }
    
    setInputValues({
      ...inputValues,
      [field]: formattedValue
    });
  };

  const calculateCarLoan = () => {
    setIsCalculating(true);
    
    // Short delay to show calculation animation if needed
    setTimeout(() => {
      try {
        // Get values from form data
        const {
          carPrice,
          deposit,
          loanTerm,
          interestRate,
          balloonPayment,
          financeType
        } = formData;
        
        // Calculate loan amount
        const loanAmount = carPrice - deposit;
        
        // Calculate monthly interest rate
        const monthlyInterestRate = interestRate / 100 / 12;
        
        // Calculate monthly payment
        let monthlyPayment = 0;
        
        if (financeType === 'hp') {
          // Standard HP calculation (no balloon)
          if (monthlyInterestRate > 0) {
            monthlyPayment = loanAmount * 
              (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTerm)) / 
              (Math.pow(1 + monthlyInterestRate, loanTerm) - 1);
          } else {
            monthlyPayment = loanAmount / loanTerm;
          }
        } else if (financeType === 'pcp') {
          // PCP calculation (with balloon)
          const amountToFinance = loanAmount - balloonPayment;
          
          if (monthlyInterestRate > 0) {
            monthlyPayment = (loanAmount - balloonPayment / Math.pow(1 + monthlyInterestRate, loanTerm)) * 
              (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTerm)) / 
              (Math.pow(1 + monthlyInterestRate, loanTerm) - 1);
          } else {
            monthlyPayment = amountToFinance / loanTerm;
          }
        }
        
        // Calculate total interest
        const totalPayments = monthlyPayment * loanTerm;
        const totalInterest = totalPayments - (loanAmount - balloonPayment);
        
        // Calculate total cost
        const totalCost = deposit + totalPayments + (financeType === 'pcp' ? balloonPayment : 0);
        
        // Calculate APR (simplified)
        // Note: This is a simplified calculation and not the exact APR calculation
        const apr = interestRate * 1.1; // Approximate APR based on interest rate
        
        setResults({
          monthlyPayment,
          totalInterest,
          totalCost,
          loanAmount,
          balloonPayment,
          apr
        });
      } catch (error) {
        console.error("Error calculating car loan:", error);
      } finally {
        setIsCalculating(false);
      }
    }, 300);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getInfoText = (field: string): string => {
    switch (field) {
      case 'carPrice':
        return 'The total price of the car including any optional extras, but excluding any discounts or part-exchange values.';
      case 'deposit':
        return 'The amount you pay upfront. A larger deposit typically results in lower monthly payments and less interest paid overall.';
      case 'loanTerm':
        return 'The length of time you\'ll be making payments. Longer terms mean lower monthly payments but more interest paid overall.';
      case 'interestRate':
        return 'The annual interest rate on your car finance. This affects how much interest you\'ll pay over the term of the agreement.';
      case 'balloonPayment':
        return 'The optional final payment at the end of a PCP agreement if you want to keep the car. This is based on the car\'s predicted future value.';
      case 'financeType':
        return 'Hire Purchase (HP): You own the car after the final payment. Personal Contract Purchase (PCP): Lower monthly payments with a final balloon payment option.';
      default:
        return '';
    }
  };

  return (
    <main className="pt-24 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sunset-start via-sunset-middle to-sunset-end flex items-center justify-center mb-6">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Car Finance Calculator</h1>
          <p className="text-gray-600 text-center max-w-2xl">
            Calculate your monthly car payments based on purchase price, deposit, interest rate and term.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Calculator Form */}
          <div className="md:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl p-6 gradient-border">
            <h2 className="text-xl font-semibold mb-4">Car Finance Details</h2>
            
            <div className="space-y-4">
              {/* Finance Type */}
              <div className="relative">
                <div className="flex items-center mb-1">
                  <label htmlFor="financeType" className="block text-sm font-medium text-gray-700">
                    Finance Type
                  </label>
                  <button 
                    type="button"
                    className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                    onClick={() => setShowInfo(showInfo === 'financeType' ? null : 'financeType')}
                    aria-label="Show information about finance type"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                
                {showInfo === 'financeType' && (
                  <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                    {getInfoText('financeType')}
                  </div>
                )}
                
                <select
                  id="financeType"
                  name="financeType"
                  value={inputValues.financeType}
                  onChange={handleInputChange}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                >
                  <option value="hp">Hire Purchase (HP)</option>
                  <option value="pcp">Personal Contract Purchase (PCP)</option>
                </select>
              </div>
              
              {/* Car Price */}
              <div className="relative">
                <div className="flex items-center mb-1">
                  <label htmlFor="carPrice" className="block text-sm font-medium text-gray-700">
                    Car Price
                  </label>
                  <button 
                    type="button"
                    className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                    onClick={() => setShowInfo(showInfo === 'carPrice' ? null : 'carPrice')}
                    aria-label="Show information about car price"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                
                {showInfo === 'carPrice' && (
                  <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                    {getInfoText('carPrice')}
                  </div>
                )}
                
                <div className="flex">
                  <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">£</span>
                    <input
                      ref={(el) => inputRefs.current.carPrice = el}
                      type="text"
                      inputMode="numeric"
                      id="carPrice"
                      name="carPrice"
                      value={inputValues.carPrice}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="block w-full pl-8 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                    />
                  </div>
                  <div className="flex ml-2">
                    <button
                      type="button"
                      onClick={() => handleAdjustValue('carPrice', false)}
                      className="p-2 rounded-l-lg border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      aria-label="Decrease car price"
                    >
                      <MinusCircle className="w-5 h-5 text-gray-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustValue('carPrice', true)}
                      className="p-2 rounded-r-lg border-t border-r border-b border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      aria-label="Increase car price"
                    >
                      <PlusCircle className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Deposit */}
              <div className="relative">
                <div className="flex items-center mb-1">
                  <label htmlFor="deposit" className="block text-sm font-medium text-gray-700">
                    Deposit
                  </label>
                  <button 
                    type="button"
                    className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                    onClick={() => setShowInfo(showInfo === 'deposit' ? null : 'deposit')}
                    aria-label="Show information about deposit"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                
                {showInfo === 'deposit' && (
                  <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                    {getInfoText('deposit')}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">£</span>
                    <input
                      ref={(el) => inputRefs.current.deposit = el}
                      type="text"
                      inputMode="numeric"
                      id="deposit"
                      name="deposit"
                      value={inputValues.deposit}
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
                      id="depositPercent"
                      name="depositPercent"
                      value={inputValues.depositPercent}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
                  </div>
                </div>
                {depositPercent >= 100 && (
                  <p className="text-xs text-sunset-text mt-1">
                    Note: Deposit is set to 100% of the car price.
                  </p>
                )}
              </div>
              
              {/* Loan Term */}
              <div className="relative">
                <div className="flex items-center mb-1">
                  <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700">
                    Loan Term (months)
                  </label>
                  <button 
                    type="button"
                    className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                    onClick={() => setShowInfo(showInfo === 'loanTerm' ? null : 'loanTerm')}
                    aria-label="Show information about loan term"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                
                {showInfo === 'loanTerm' && (
                  <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                    {getInfoText('loanTerm')}
                  </div>
                )}
                
                <div className="flex">
                  <div className="relative flex-grow">
                    <input
                      ref={(el) => inputRefs.current.loanTerm = el}
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
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">months</span>
                  </div>
                  <div className="flex ml-2">
                    <button
                      type="button"
                      onClick={() => handleAdjustValue('loanTerm', false)}
                      className="p-2 rounded-l-lg border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      aria-label="Decrease loan term"
                    >
                      <MinusCircle className="w-5 h-5 text-gray-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustValue('loanTerm', true)}
                      className="p-2 rounded-r-lg border-t border-r border-b border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      aria-label="Increase loan term"
                    >
                      <PlusCircle className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.floor(formData.loanTerm / 12)} years {formData.loanTerm % 12} months
                </div>
              </div>
              
              {/* Interest Rate */}
              <div className="relative">
                <div className="flex items-center mb-1">
                  <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">
                    Interest Rate
                  </label>
                  <button 
                    type="button"
                    className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                    onClick={() => setShowInfo(showInfo === 'interestRate' ? null : 'interestRate')}
                    aria-label="Show information about interest rate"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                
                {showInfo === 'interestRate' && (
                  <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                    {getInfoText('interestRate')}
                  </div>
                )}
                
                <div className="flex">
                  <div className="relative flex-grow">
                    <input
                      ref={(el) => inputRefs.current.interestRate = el}
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
                  <div className="flex ml-2">
                    <button
                      type="button"
                      onClick={() => handleAdjustValue('interestRate', false)}
                      className="p-2 rounded-l-lg border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      aria-label="Decrease interest rate"
                    >
                      <MinusCircle className="w-5 h-5 text-gray-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustValue('interestRate', true)}
                      className="p-2 rounded-r-lg border-t border-r border-b border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      aria-label="Increase interest rate"
                    >
                      <PlusCircle className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Balloon Payment (PCP only) */}
              {formData.financeType === 'pcp' && (
                <div className="relative">
                  <div className="flex items-center mb-1">
                    <label htmlFor="balloonPayment" className="block text-sm font-medium text-gray-700">
                      Optional Final Payment (Balloon)
                    </label>
                    <button 
                      type="button"
                      className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                      onClick={() => setShowInfo(showInfo === 'balloonPayment' ? null : 'balloonPayment')}
                      aria-label="Show information about balloon payment"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {showInfo === 'balloonPayment' && (
                    <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                      {getInfoText('balloonPayment')}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">£</span>
                      <input
                        ref={(el) => inputRefs.current.balloonPayment = el}
                        type="text"
                        inputMode="numeric"
                        id="balloonPayment"
                        name="balloonPayment"
                        value={inputValues.balloonPayment}
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
                        id="balloonPercent"
                        name="balloonPercent"
                        value={inputValues.balloonPercent}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
                    </div>
                  </div>
                  {balloonPercent > 60 && (
                    <p className="text-xs text-sunset-text mt-1">
                      Note: Balloon payment is capped at 60% of the car price.
                    </p>
                  )}
                </div>
              )}
              
              {/* Calculate Button */}
              <div className="mt-6">
                <button
                  onClick={calculateCarLoan}
                  disabled={isCalculating || formData.deposit >= formData.carPrice}
                  className={`w-full gradient-button text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-lg ${
                    formData.deposit >= formData.carPrice ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isCalculating ? 'Calculating...' : 'Calculate Car Finance'}
                </button>
                {formData.deposit >= formData.carPrice && (
                  <p className="text-sm text-sunset-text mt-2 text-center">
                    Deposit cannot be equal to or greater than the car price.
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
                    {formatCurrency(results.monthlyPayment)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Finance Type</p>
                    <p className="text-sm font-medium">
                      {formData.financeType === 'hp' ? 'Hire Purchase (HP)' : 'Personal Contract Purchase (PCP)'}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Car Price</p>
                    <p className="text-sm font-medium">{formatCurrency(formData.carPrice)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Deposit</p>
                    <p className="text-sm font-medium">{formatCurrency(formData.deposit)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Amount Financed</p>
                    <p className="text-sm font-medium">{formatCurrency(results.loanAmount)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Term</p>
                    <p className="text-sm font-medium">
                      {Math.floor(formData.loanTerm / 12)} years {formData.loanTerm % 12} months
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="text-sm font-medium">{formData.interestRate}%</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Representative APR</p>
                    <p className="text-sm font-medium">{results.apr.toFixed(1)}%</p>
                  </div>
                  
                  {formData.financeType === 'pcp' && (
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-600">Optional Final Payment</p>
                      <p className="text-sm font-medium">{formatCurrency(results.balloonPayment)}</p>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-700">Total Interest</p>
                    <p className="text-sm font-medium">{formatCurrency(results.totalInterest)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-700">Total Cost</p>
                    <p className="text-sm font-medium">{formatCurrency(results.totalCost)}</p>
                  </div>
                  
                  {/* Finance Breakdown */}
                  <div className="border-t border-gray-200 my-3"></div>
                  
                  <div className="bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg p-3">
                    <h3 className="text-sm font-semibold mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-1" />
                      Finance Breakdown
                    </h3>
                    
                    <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                      {/* Deposit */}
                      <div 
                        className="absolute h-full bg-[#FF8C42]"
                        style={{ 
                          width: `${(formData.deposit / results.totalCost) * 100}%`,
                          minWidth: '2%'
                        }}
                      ></div>
                      
                      {/* Monthly Payments */}
                      <div 
                        className="absolute h-full bg-[#4285F4]"
                        style={{ 
                          width: `${((results.monthlyPayment * formData.loanTerm) / results.totalCost) * 100}%`,
                          left: `${(formData.deposit / results.totalCost) * 100}%`,
                          minWidth: '2%'
                        }}
                      ></div>
                      
                       {/* Balloon Payment (PCP only) */}
                      {formData.financeType === 'pcp' && (
                        <div 
                          className="absolute h-full bg-[#34A853]"
                          style={{ 
                            width: `${(results.balloonPayment / results.totalCost) * 100}%`,
                            left: `${(formData.deposit + (results.monthlyPayment * formData.loanTerm)) / results.totalCost * 100}%`,
                            minWidth: '2%'
                          }}
                        ></div>
                      )}
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-[#FF8C42] mr-1 rounded-sm"></div>
                        <span>Deposit</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-[#4285F4] mr-1 rounded-sm"></div>
                        <span>Monthly Payments</span>
                      </div>
                      {formData.financeType === 'pcp' && (
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-[#34A853] mr-1 rounded-sm"></div>
                          <span>Final Payment</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-gray-500 mb-2">Enter your car finance details and click calculate to see your payment breakdown.</p>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sunset-start/20 via-sunset-middle/20 to-sunset-end/20 flex items-center justify-center mt-4">
                  <Car className="w-6 h-6 text-sunset-middle opacity-60" />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Additional Information */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 gradient-border">
          <h2 className="text-xl font-semibold mb-4">Understanding Car Finance Options</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              When financing a car in the UK, you typically have two main options: Hire Purchase (HP) and Personal Contract Purchase (PCP).
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Hire Purchase (HP)</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Ownership:</strong> You own the car after the final payment.</li>
                  <li><strong>Payments:</strong> Fixed monthly payments that cover the full value of the car.</li>
                  <li><strong>Deposit:</strong> Typically 10% of the car's value.</li>
                  <li><strong>End of Agreement:</strong> No final balloon payment, you own the car outright.</li>
                  <li><strong>Best For:</strong> Those who want to own the car and keep it for longer periods.</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Personal Contract Purchase (PCP)</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Ownership:</strong> Option to buy at the end by paying the balloon payment.</li>
                  <li><strong>Payments:</strong> Lower monthly payments as you're only paying for the depreciation.</li>
                  <li><strong>Deposit:</strong> Typically 10% of the car's value.</li>
                  <li><strong>End of Agreement:</strong> Three options: pay the balloon payment to keep the car, return the car, or trade in for a new one.</li>
                  <li><strong>Best For:</strong> Those who want lower monthly payments and flexibility at the end.</li>
                </ul>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">Key Terms Explained</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>APR (Annual Percentage Rate):</strong> The total cost of credit expressed as an annual percentage, including interest and fees.</li>
              <li><strong>Balloon Payment:</strong> The optional final payment at the end of a PCP agreement if you want to own the car.</li>
              <li><strong>Deposit:</strong> The upfront payment you make at the start of the finance agreement.</li>
              <li><strong>Term:</strong> The length of the finance agreement, typically 24-60 months.</li>
              <li><strong>Total Cost:</strong> The total amount you'll pay over the entire agreement, including deposit, monthly payments, and any final payment.</li>
            </ul>
            
            <div className="bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg p-4 mt-4">
              <p className="text-sm">
                <strong>Important:</strong> This calculator provides estimates based on the information you provide. Actual finance offers may vary based on your credit score, the specific lender, and other factors. Always check the full terms and conditions of any finance agreement before signing.
              </p>
            </div>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">Tips for Car Finance</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Shop around:</strong> Compare offers from different lenders to find the best rate.</li>
              <li><strong>Consider the total cost:</strong> Look beyond the monthly payment to understand the total amount you'll pay.</li>
              <li><strong>Check for early repayment charges:</strong> Some agreements have penalties for paying off the loan early.</li>
              <li><strong>Understand mileage limits:</strong> PCP agreements often have mileage restrictions with charges for exceeding them.</li>
              <li><strong>Negotiate the car price:</strong> The lower the car price, the less you'll need to finance.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
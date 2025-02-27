import React, { useState, useRef, useEffect } from 'react';
import { LineChart, PieChart, PoundSterling, HelpCircle, Calendar, Percent, ArrowRight, TrendingUp } from 'lucide-react';

interface FormData {
  currentAge: number;
  retirementAge: number;
  currentPension: number;
  monthlyContribution: number;
  employerContribution: number;
  stocksAllocation: number;
  bondsAllocation: number;
  cashAllocation: number;
  stocksReturn: number;
  bondsReturn: number;
  cashReturn: number;
  inflationRate: number;
}

interface InputFieldState {
  currentAge: string;
  retirementAge: string;
  currentPension: string;
  monthlyContribution: string;
  employerContribution: string;
  stocksAllocation: string;
  bondsAllocation: string;
  cashAllocation: string;
  stocksReturn: string;
  bondsReturn: string;
  cashReturn: string;
  inflationRate: string;
}

interface ProjectionResult {
  finalPensionNominal: number;
  finalPensionReal: number;
  totalContributions: number;
  totalEmployerContributions: number;
  totalInvestmentGrowth: number;
  yearlyBreakdown: {
    age: number;
    year: number;
    pensionValue: number;
    realPensionValue: number;
    annualContribution: number;
    annualEmployerContribution: number;
    annualGrowth: number;
    stocks: number;
    bonds: number;
    cash: number;
  }[];
}

export function PensionProjection() {
  // Default values for the calculator
  const [formData, setFormData] = useState<FormData>({
    currentAge: 30,
    retirementAge: 68,
    currentPension: 50000,
    monthlyContribution: 500,
    employerContribution: 300,
    stocksAllocation: 70,
    bondsAllocation: 20,
    cashAllocation: 10,
    stocksReturn: 7.0,
    bondsReturn: 3.0,
    cashReturn: 1.5,
    inflationRate: 2.0
  });

  // Input field values (as strings to handle formatting)
  const [inputValues, setInputValues] = useState<InputFieldState>({
    currentAge: '30',
    retirementAge: '68',
    currentPension: '50,000',
    monthlyContribution: '500',
    employerContribution: '300',
    stocksAllocation: '70',
    bondsAllocation: '20',
    cashAllocation: '10',
    stocksReturn: '7.0',
    bondsReturn: '3.0',
    cashReturn: '1.5',
    inflationRate: '2.0'
  });

  const [results, setResults] = useState<ProjectionResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<string | null>(null);
  const [selectedYearIndex, setSelectedYearIndex] = useState<number | null>(null);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  
  // Store cursor position for formatted inputs
  const cursorPositionRef = useRef<number | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({
    currentPension: null,
    monthlyContribution: null,
    employerContribution: null
  });

  // Calculate results when form data changes
  useEffect(() => {
    // Validate allocation percentages
    const totalAllocation = formData.stocksAllocation + formData.bondsAllocation + formData.cashAllocation;
    
    if (totalAllocation !== 100) {
      setAllocationError(`Asset allocation must total 100% (currently ${totalAllocation}%)`);
    } else {
      setAllocationError(null);
      calculateProjection();
    }
  }, [formData]);

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
    if (value === '0' || value === '0,000' || value === '0.0') {
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
      const defaultValue = ['stocksReturn', 'bondsReturn', 'cashReturn', 'inflationRate'].includes(name) ? '0.0' : '0';
      setInputValues({
        ...inputValues,
        [name]: defaultValue
      });
      
      // Update the numeric value for calculations
      setFormData({
        ...formData,
        [name]: 0
      });
    } else if (['currentPension', 'monthlyContribution', 'employerContribution'].includes(name)) {
      // Ensure proper formatting on blur for numeric fields
      const numericValue = parseFormattedNumber(value);
      setInputValues({
        ...inputValues,
        [name]: formatNumberWithCommas(numericValue)
      });
    } else if (['stocksAllocation', 'bondsAllocation', 'cashAllocation'].includes(name)) {
      // Ensure allocation values are integers
      const numericValue = Math.round(parseFloat(value));
      setInputValues({
        ...inputValues,
        [name]: numericValue.toString()
      });
      setFormData({
        ...formData,
        [name]: numericValue
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Store current cursor position before update
    const cursorPos = e.target.selectionStart;
    cursorPositionRef.current = cursorPos;
    
    // Handle different input types
    if (['currentPension', 'monthlyContribution', 'employerContribution'].includes(name)) {
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
    } else if (['currentAge', 'retirementAge'].includes(name)) {
      // For age fields, only allow integers
      const cleanValue = value.replace(/[^\d]/g, '');
      
      setInputValues({
        ...inputValues,
        [name]: cleanValue
      });
      
      if (cleanValue !== '') {
        const numericValue = parseInt(cleanValue, 10);
        
        // Validate age range (18-100)
        if (numericValue >= 18 && numericValue <= 100) {
          setFormData({
            ...formData,
            [name]: numericValue
          });
        }
      }
    } else if (['stocksAllocation', 'bondsAllocation', 'cashAllocation'].includes(name)) {
      // For allocation percentages, only allow integers up to 100
      const cleanValue = value.replace(/[^\d]/g, '');
      
      setInputValues({
        ...inputValues,
        [name]: cleanValue
      });
      
      if (cleanValue !== '') {
        const numericValue = parseInt(cleanValue, 10);
        
        // Validate percentage range (0-100)
        if (numericValue >= 0 && numericValue <= 100) {
          setFormData({
            ...formData,
            [name]: numericValue
          });
        }
      }
    } else if (['stocksReturn', 'bondsReturn', 'cashReturn', 'inflationRate'].includes(name)) {
      // For return rates, allow decimals
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
        
        // Validate return rate range (0-30)
        if (numericValue >= 0 && numericValue <= 30) {
          setFormData({
            ...formData,
            [name]: numericValue
          });
        }
      }
    } else {
      // For other fields, use standard handling
      setInputValues({
        ...inputValues,
        [name]: value
      });
      
      if (value !== '') {
        let parsedValue: number;
        
        if (['currentAge', 'retirementAge'].includes(name)) {
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

  const calculateProjection = () => {
    setIsCalculating(true);
    
    // Short delay to show calculation animation if needed
    setTimeout(() => {
      try {
        // Get values from form data
        const {
          currentAge,
          retirementAge,
          currentPension,
          monthlyContribution,
          employerContribution,
          stocksAllocation,
          bondsAllocation,
          cashAllocation,
          stocksReturn,
          bondsReturn,
          cashReturn,
          inflationRate
        } = formData;
        
        // Calculate years until retirement
        const yearsToRetirement = retirementAge - currentAge;
        
        if (yearsToRetirement <= 0) {
          throw new Error("Retirement age must be greater than current age");
        }
        
        // Calculate weighted average return based on asset allocation
        const weightedReturn = (
          (stocksAllocation / 100) * stocksReturn +
          (bondsAllocation / 100) * bondsReturn +
          (cashAllocation / 100) * cashReturn
        );
        
        // Initialize variables for projection
        let pensionValue = currentPension;
        let totalContributions = currentPension;
        let totalEmployerContributions = 0;
        let totalGrowth = 0;
        
        // Annual contribution (monthly * 12)
        const annualContribution = monthlyContribution * 12;
        const annualEmployerContribution = employerContribution * 12;
        
        // Create yearly breakdown
        const yearlyBreakdown = [];
        const currentYear = new Date().getFullYear();
        
        // Calculate projection for each year
        for (let year = 0; year <= yearsToRetirement; year++) {
          const age = currentAge + year;
          const calendarYear = currentYear + year;
          
          // Skip year 0 for growth calculation (initial state)
          let yearGrowth = 0;
          if (year > 0) {
            // Calculate growth for this year
            yearGrowth = pensionValue * (weightedReturn / 100);
            
            // Add contributions and growth
            pensionValue += yearGrowth + annualContribution + annualEmployerContribution;
            
            // Update totals
            totalContributions += annualContribution;
            totalEmployerContributions += annualEmployerContribution;
            totalGrowth += yearGrowth;
          }
          
          // Calculate real value (adjusted for inflation)
          const inflationFactor = Math.pow(1 + (inflationRate / 100), year);
          const realPensionValue = pensionValue / inflationFactor;
          
          // Calculate asset values based on allocation
          const stocksValue = pensionValue * (stocksAllocation / 100);
          const bondsValue = pensionValue * (bondsAllocation / 100);
          const cashValue = pensionValue * (cashAllocation / 100);
          
          // Add to yearly breakdown
          yearlyBreakdown.push({
            age,
            year: calendarYear,
            pensionValue,
            realPensionValue,
            annualContribution: year > 0 ? annualContribution : 0,
            annualEmployerContribution: year > 0 ? annualEmployerContribution : 0,
            annualGrowth: yearGrowth,
            stocks: stocksValue,
            bonds: bondsValue,
            cash: cashValue
          });
        }
        
        // Set results
        setResults({
          finalPensionNominal: pensionValue,
          finalPensionReal: yearlyBreakdown[yearlyBreakdown.length - 1].realPensionValue,
          totalContributions,
          totalEmployerContributions,
          totalInvestmentGrowth: totalGrowth,
          yearlyBreakdown
        });
        
        // Set selected year to the final year by default
        setSelectedYearIndex(yearlyBreakdown.length - 1);
      } catch (error) {
        console.error("Error calculating pension projection:", error);
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

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  const getInfoText = (field: string): string => {
    switch (field) {
      case 'currentAge':
        return 'Your current age in years.';
      case 'retirementAge':
        return 'The age at which you plan to retire.';
      case 'currentPension':
        return 'The current value of your pension pot.';
      case 'monthlyContribution':
        return 'How much you contribute to your pension each month.';
      case 'employerContribution':
        return 'How much your employer contributes to your pension each month.';
      case 'stocksAllocation':
        return 'Percentage of your pension invested in stocks/equities. Typically higher risk but higher potential returns.';
      case 'bondsAllocation':
        return 'Percentage of your pension invested in bonds. Typically medium risk with moderate returns.';
      case 'cashAllocation':
        return 'Percentage of your pension held in cash or cash equivalents. Low risk but also low returns.';
      case 'stocksReturn':
        return 'Expected annual return percentage for the stocks portion of your portfolio.';
      case 'bondsReturn':
        return 'Expected annual return percentage for the bonds portion of your portfolio.';
      case 'cashReturn':
        return 'Expected annual return percentage for the cash portion of your portfolio.';
      case 'inflationRate':
        return 'Expected annual inflation rate. This affects the real value of your pension over time.';
      default:
        return '';
    }
  };

  return (
    <main className="pt-24 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sunset-start via-sunset-middle to-sunset-end flex items-center justify-center mb-6">
            <LineChart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Pension Projection Calculator</h1>
          <p className="text-gray-600 text-center max-w-2xl">
            Project your pension growth based on your asset allocation and expected returns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Calculator Form */}
          <div className="md:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl p-6 gradient-border">
            <h2 className="text-xl font-semibold mb-4">Pension Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Personal Information</h3>
                
                {/* Current Age */}
                <div className="relative">
                  <div className="flex items-center mb-1">
                    <label htmlFor="currentAge" className="block text-sm font-medium text-gray-700">
                      Current Age
                    </label>
                    <button 
                      type="button"
                      className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                      onClick={() => setShowInfo(showInfo === 'currentAge' ? null : 'currentAge')}
                      aria-label="Show information about current age"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {showInfo === 'currentAge' && (
                    <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                      {getInfoText('currentAge')}
                    </div>
                  )}
                  
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      id="currentAge"
                      name="currentAge"
                      value={inputValues.currentAge}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">years</span>
                  </div>
                </div>
                
                {/* Retirement Age */}
                <div className="relative">
                  <div className="flex items-center mb-1">
                    <label htmlFor="retirementAge" className="block text-sm font-medium text-gray-700">
                      Retirement Age
                    </label>
                    <button 
                      type="button"
                      className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                      onClick={() => setShowInfo(showInfo === 'retirementAge' ? null : 'retirementAge')}
                      aria-label="Show information about retirement age"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {showInfo === 'retirementAge' && (
                    <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                      {getInfoText('retirementAge')}
                    </div>
                  )}
                  
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      id="retirementAge"
                      name="retirementAge"
                      value={inputValues.retirementAge}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">years</span>
                  </div>
                </div>
                
                {/* Current Pension */}
                <div className="relative">
                  <div className="flex items-center mb-1">
                    <label htmlFor="currentPension" className="block text-sm font-medium text-gray-700">
                      Current Pension Value
                    </label>
                    <button 
                      type="button"
                      className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                      onClick={() => setShowInfo(showInfo === 'currentPension' ? null : 'currentPension')}
                      aria-label="Show information about current pension"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {showInfo === 'currentPension' && (
                    <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                      {getInfoText('currentPension')}
                    </div>
                  )}
                  
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">£</span>
                    <input
                      ref={(el) => inputRefs.current.currentPension = el}
                      type="text"
                      inputMode="numeric"
                      id="currentPension"
                      name="currentPension"
                      value={inputValues.currentPension}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                    />
                  </div>
                </div>
                
                {/* Monthly Contribution */}
                <div className="relative">
                  <div className="flex items-center mb-1">
                    <label htmlFor="monthlyContribution" className="block text-sm font-medium text-gray-700">
                      Your Monthly Contribution
                    </label>
                    <button 
                      type="button"
                      className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                      onClick={() => setShowInfo(showInfo === 'monthlyContribution' ? null : 'monthlyContribution')}
                      aria-label="Show information about monthly contribution"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {showInfo === 'monthlyContribution' && (
                    <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                      {getInfoText('monthlyContribution')}
                    </div>
                  )}
                  
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">£</span>
                    <input
                      ref={(el) => inputRefs.current.monthlyContribution = el}
                      type="text"
                      inputMode="numeric"
                      id="monthlyContribution"
                      name="monthlyContribution"
                      value={inputValues.monthlyContribution}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                    />
                  </div>
                </div>
                
                {/* Employer Contribution */}
                <div className="relative">
                  <div className="flex items-center mb-1">
                    <label htmlFor="employerContribution" className="block text-sm font-medium text-gray-700">
                      Employer Monthly Contribution
                    </label>
                    <button 
                      type="button"
                      className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                      onClick={() => setShowInfo(showInfo === 'employerContribution' ? null : 'employerContribution')}
                      aria-label="Show information about employer contribution"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {showInfo === 'employerContribution' && (
                    <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                      {getInfoText('employerContribution')}
                    </div>
                  )}
                  
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">£</span>
                    <input
                      ref={(el) => inputRefs.current.employerContribution = el}
                      type="text"
                      inputMode="numeric"
                      id="employerContribution"
                      name="employerContribution"
                      value={inputValues.employerContribution}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                    />
                  </div>
                </div>
                
                {/* Inflation Rate */}
                <div className="relative">
                  <div className="flex items-center mb-1">
                    <label htmlFor="inflationRate" className="block text-sm font-medium text-gray-700">
                      Inflation Rate
                    </label>
                    <button 
                      type="button"
                      className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                      onClick={() => setShowInfo(showInfo === 'inflationRate' ? null : 'inflationRate')}
                      aria-label="Show information about inflation rate"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {showInfo === 'inflationRate' && (
                    <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                      {getInfoText('inflationRate')}
                    </div>
                  )}
                  
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      id="inflationRate"
                      name="inflationRate"
                      value={inputValues.inflationRate}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
                  </div>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Asset Allocation & Returns</h3>
                
                {/* Asset Allocation */}
                <div className="p-4 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg">
                  <div className="flex items-center mb-2">
                    <PieChart className="w-5 h-5 mr-2 text-sunset-text" />
                    <h4 className="text-sm font-semibold text-gray-700">Asset Allocation</h4>
                  </div>
                  
                  {/* Stocks Allocation */}
                  <div className="mb-3">
                    <div className="flex items-center mb-1">
                      <label htmlFor="stocksAllocation" className="block text-sm font-medium text-gray-700">
                        Stocks
                      </label>
                      <button 
                        type="button"
                        className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                        onClick={() => setShowInfo(showInfo === 'stocksAllocation' ? null : 'stocksAllocation')}
                        aria-label="Show information about stocks allocation"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {showInfo === 'stocksAllocation' && (
                      <div className="mb-2 p-2 bg-white/50 rounded-lg text-sm text-gray-600">
                        {getInfoText('stocksAllocation')}
                      </div>
                    )}
                    
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        id="stocksAllocation"
                        name="stocksAllocation"
                        value={inputValues.stocksAllocation}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
                    </div>
                  </div>
                  
                  {/* Bonds Allocation */}
                  <div className="mb-3">
                    <div className="flex items-center mb-1">
                      <label htmlFor="bondsAllocation" className="block text-sm font-medium text-gray-700">
                        Bonds
                      </label>
                      <button 
                        type="button"
                        className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                        onClick={() => setShowInfo(showInfo === 'bondsAllocation' ? null : 'bondsAllocation')}
                        aria-label="Show information about bonds allocation"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {showInfo === 'bondsAllocation' && (
                      <div className="mb-2 p-2 bg-white/50 rounded-lg text-sm text-gray-600">
                        {getInfoText('bondsAllocation')}
                      </div>
                    )}
                    
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        id="bondsAllocation"
                        name="bondsAllocation"
                        value={inputValues.bondsAllocation}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
                    </div>
                  </div>
                  
                  {/* Cash Allocation */}
                  <div className="mb-3">
                    <div className="flex items-center mb-1">
                      <label htmlFor="cashAllocation" className="block text-sm font-medium text-gray-700">
                        Cash
                      </label>
                      <button 
                        type="button"
                        className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                        onClick={() => setShowInfo(showInfo === 'cashAllocation' ? null : 'cashAllocation')}
                        aria-label="Show information about cash allocation"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {showInfo === 'cashAllocation' && (
                      <div className="mb-2 p-2 bg-white/50 rounded-lg text-sm text-gray-600">
                        {getInfoText('cashAllocation')}
                      </div>
                    )}
                    
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        id="cashAllocation"
                        name="cashAllocation"
                        value={inputValues.cashAllocation}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
                    </div>
                  </div>
                  
                  {allocationError && (
                    <div className="text-sunset-text text-sm mt-2">
                      {allocationError}
                    </div>
                  )}
                </div>
                
                {/* Expected Returns */}
                <div className="p-4 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="w-5 h-5 mr-2 text-sunset-text" />
                    <h4 className="text-sm font-semibold text-gray-700">Expected Annual Returns</h4>
                  </div>
                  
                  {/* Stocks Return */}
                  <div className="mb-3">
                    <div className="flex items-center mb-1">
                      <label htmlFor="stocksReturn" className="block text-sm font-medium text-gray-700">
                        Stocks Return
                      </label>
                      <button 
                        type="button"
                        className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                        onClick={() => setShowInfo(showInfo === 'stocksReturn' ? null : 'stocksReturn')}
                        aria-label="Show information about stocks return"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {showInfo === 'stocksReturn' && (
                      <div className="mb-2 p-2 bg-white/50 rounded-lg text-sm text-gray-600">
                        {getInfoText('stocksReturn')}
                      </div>
                    )}
                    
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        id="stocksReturn"
                        name="stocksReturn"
                        value={inputValues.stocksReturn}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
                    </div>
                  </div>
                  
                  {/* Bonds Return */}
                  <div className="mb-3">
                    <div className="flex items-center mb-1">
                      <label htmlFor="bondsReturn" className="block text-sm font-medium text-gray-700">
                        Bonds Return
                      </label>
                      <button 
                        type="button"
                        className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                        onClick={() => setShowInfo(showInfo === 'bondsReturn' ? null : 'bondsReturn')}
                        aria-label="Show information about bonds return"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {showInfo === 'bondsReturn' && (
                      <div className="mb-2 p-2 bg-white/50 rounded-lg text-sm text-gray-600">
                        {getInfoText('bondsReturn')}
                      </div>
                    )}
                    
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        id="bondsReturn"
                        name="bondsReturn"
                        value={inputValues.bondsReturn}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
                    </div>
                  </div>
                  
                  {/* Cash Return */}
                  <div>
                    <div className="flex items-center mb-1">
                      <label htmlFor="cashReturn" className="block text-sm font-medium text-gray-700">
                        Cash Return
                      </label>
                      <button 
                        type="button"
                        className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                        onClick={() => setShowInfo(showInfo === 'cashReturn' ? null : 'cashReturn')}
                        aria-label="Show information about cash return"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {showInfo === 'cashReturn' && (
                      <div className="mb-2 p-2 bg-white/50 rounded-lg text-sm text-gray-600">
                        {getInfoText('cashReturn')}
                      </div>
                    )}
                    
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        id="cashReturn"
                        name="cashReturn"
                        value={inputValues.cashReturn}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Calculate Button */}
            <div className="mt-6">
              <button
                onClick={calculateProjection}
                disabled={isCalculating || allocationError !== null || formData.retirementAge <= formData.currentAge}
                className={`w-full gradient-button text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-lg ${
                  isCalculating || allocationError !== null || formData.retirementAge <= formData.currentAge
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
              >
                {isCalculating ? 'Calculating...' : 'Calculate Pension Projection'}
              </button>
              
              {formData.retirementAge <= formData.currentAge && (
                <p className="text-sm text-sunset-text mt-2 text-center">
                  Retirement age must be greater than current age.
                </p>
              )}
            </div>
          </div>
          
          {/* Results Panel */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 gradient-border">
            <h2 className="text-xl font-semibold mb-4">Projection Results</h2>
            
            {results ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-sunset-start/10 to-sunset-end/10 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Projected Pension at Age {formData.retirementAge}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(Math.round(results.finalPensionNominal))}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(Math.round(results.finalPensionReal))} in today's money
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Your Contributions</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(Math.round(results.totalContributions))}
                    </p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Employer Contributions</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(Math.round(results.totalEmployerContributions))}
                    </p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Investment Growth</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(Math.round(results.totalInvestmentGrowth))}
                    </p>
                  </div>
                  
                  <div className="border-t border-gray-200 my-3"></div>
                  
                  {/* Asset Allocation Visualization */ }
                  <div className="bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg p-3">
                    <h3 className="text-sm font-semibold mb-2 flex items-center">
                      <PieChart className="w-4 h-4 mr-1" />
                      Asset Allocation
                    </h3>
                    
                    {/* Stocks */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Stocks ({formData.stocksAllocation}%)</span>
                        {selectedYearIndex !== null && (
                          <span>{formatCurrency(Math.round(results.yearlyBreakdown[selectedYearIndex].stocks))}</span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-[#FF8C42] h-2.5 rounded-full" 
                          style={{ width: `${formData.stocksAllocation}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Bonds */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Bonds ({formData.bondsAllocation}%)</span>
                        {selectedYearIndex !== null && (
                          <span>{formatCurrency(Math.round(results.yearlyBreakdown[selectedYearIndex].bonds))}</span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-[#FF5F6D] h-2.5 rounded-full" 
                          style={{ width: `${formData.bondsAllocation}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Cash */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Cash ({formData.cashAllocation}%)</span>
                        {selectedYearIndex !== null && (
                          <span>{formatCurrency(Math.round(results.yearlyBreakdown[selectedYearIndex].cash))}</span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-[#FF4B6A] h-2.5 rounded-full" 
                          style={{ width: `${formData.cashAllocation}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Year Selector */}
                  {results.yearlyBreakdown.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold mb-2">Select Year to View</h3>
                      <div className="flex items-center">
                        <input
                          type="range"
                          min="0"
                          max={results.yearlyBreakdown.length - 1}
                          value={selectedYearIndex !== null ? selectedYearIndex : results.yearlyBreakdown.length - 1}
                          onChange={(e) => setSelectedYearIndex(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      {selectedYearIndex !== null && (
                        <div className="mt-2 text-center">
                          <p className="text-sm font-medium">
                            Age {results.yearlyBreakdown[selectedYearIndex].age} ({results.yearlyBreakdown[selectedYearIndex].year})
                          </p>
                          <p className="text-xs text-gray-600">
                            Pension value: {formatCurrency(Math.round(results.yearlyBreakdown[selectedYearIndex].pensionValue))}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Yearly Breakdown */}
                  {selectedYearIndex !== null && selectedYearIndex > 0 && (
                    <div className="mt-4 p-3 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg">
                      <h3 className="text-sm font-semibold mb-2">Year Details</h3>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Your Contribution:</span>
                          <span>{formatCurrency(results.yearlyBreakdown[selectedYearIndex].annualContribution)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Employer Contribution:</span>
                          <span>{formatCurrency(results.yearlyBreakdown[selectedYearIndex].annualEmployerContribution)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Investment Growth:</span>
                          <span>{formatCurrency(Math.round(results.yearlyBreakdown[selectedYearIndex].annualGrowth))}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-1 border-t border-gray-200/50 mt-1">
                          <span>Real Value (today's money):</span>
                          <span>{formatCurrency(Math.round(results.yearlyBreakdown[selectedYearIndex].realPensionValue))}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-gray-500 mb-2">Enter your pension details and click calculate to see your projected pension value.</p>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sunset-start/20 via-sunset-middle/20 to-sunset-end/20 flex items-center justify-center mt-4">
                  <LineChart className="w-6 h-6 text-sunset-middle opacity-60" />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Projection Chart */}
        {results && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 gradient-border">
            <h2 className="text-xl font-semibold mb-4">Pension Growth Projection</h2>
            
            {/* Chart */}
            <div className="h-80 relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-gray-500">
                <div>{formatCurrency(results.finalPensionNominal)}</div>
                <div>{formatCurrency(results.finalPensionNominal * 0.75)}</div>
                <div>{formatCurrency(results.finalPensionNominal * 0.5)}</div>
                <div>{formatCurrency(results.finalPensionNominal * 0.25)}</div>
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
                
                {/* Bars for pension value */}
                <div className="absolute inset-0 flex items-end">
                  {results.yearlyBreakdown.map((data, index) => {
                    const barWidth = `${100 / results.yearlyBreakdown.length}%`;
                    const barHeight = `${(data.pensionValue / results.finalPensionNominal) * 100}%`;
                    const realValueHeight = `${(data.realPensionValue / results.finalPensionNominal) * 100}%`;
                    
                    // Calculate percentages for stacked bar
                    const totalValue = data.pensionValue;
                    const stocksPercentage = (data.stocks / totalValue) * 100;
                    const bondsPercentage = (data.bonds / totalValue) * 100;
                    const cashPercentage = (data.cash / totalValue) * 100;
                    
                    return (
                      <div 
                        key={index} 
                        className="flex flex-col items-center justify-end h-full relative"
                        style={{ width: barWidth }}
                        onMouseEnter={() => setSelectedYearIndex(index)}
                      >
                        {/* Nominal value bar (stacked) */}
                        <div 
                          className="w-4/5 relative flex flex-col justify-end"
                          style={{ height: barHeight }}
                        >
                          {/* Cash portion - top */}
                          <div 
                            className="w-full bg-[#FF4B6A]"
                            style={{ height: `${cashPercentage}%` }}
                          ></div>
                          
                          {/* Bonds portion - middle */}
                          <div 
                            className="w-full bg-[#FF5F6D]"
                            style={{ height: `${bondsPercentage}%` }}
                          ></div>
                          
                          {/* Stocks portion - bottom */}
                          <div 
                            className="w-full bg-[#FF8C42]"
                            style={{ height: `${stocksPercentage}%` }}
                          ></div>
                          
                          {/* Real value line */}
                          <div 
                            className="absolute bottom-0 left-0 w-full h-0.5 bg-white"
                            style={{ bottom: realValueHeight }}
                          ></div>
                        </div>
                        
                        {/* Age label */}
                        {index % Math.max(1, Math.floor(results.yearlyBreakdown.length / 10)) === 0 && (
                          <div className="absolute bottom-0 transform translate-y-full text-xs text-gray-500 mt-1">
                            {data.age}
                          </div>
                        )}
                        
                        {/* Highlight selected year */}
                        {selectedYearIndex === index && (
                          <div className="absolute inset-y-0 w-4/5 border-2 border-white rounded-sm shadow-sm"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* X-axis label */}
              <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-500 mt-6">
                Age
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center mt-6 space-x-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#FF8C42] mr-2"></div>
                <span className="text-sm text-gray-700">Stocks</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#FF5F6D] mr-2"></div>
                <span className="text-sm text-gray-700">Bonds</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#FF4B6A] mr-2"></div>
                <span className="text-sm text-gray-700">Cash</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-0.5 bg-white border border-gray-400 mr-2"></div>
                <span className="text-sm text-gray-700">Real Value</span>
              </div>
            </div>
            
            {/* Contribution breakdown */}
            <div className="mt-8 p-4 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Pension Composition</h3>
              
              <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                {/* Your contributions */}
                <div 
                  className="absolute h-full bg-[#FF8C42] flex items-center justify-center"
                  style={{ 
                    width: `${(results.totalContributions / results.finalPensionNominal) * 100}%`,
                  }}
                >
                  <span className="text-xs text-white font-medium px-2 truncate">Your Contributions</span>
                </div>
                
                {/* Employer contributions */}
                <div 
                  className="absolute h-full bg-[#FF5F6D] flex items-center justify-center"
                  style={{ 
                    width: `${(results.totalEmployerContributions / results.finalPensionNominal) * 100}%`,
                    left: `${(results.totalContributions / results.finalPensionNominal) * 100}%`
                  }}
                >
                  <span className="text-xs text-white font-medium px-2 truncate">Employer</span>
                </div>
                
                {/* Investment growth */}
                <div 
                  className="absolute h-full bg-[#FF4B6A] flex items-center justify-center"
                  style={{ 
                    width: `${(results.totalInvestmentGrowth / results.finalPensionNominal) * 100}%`,
                    left: `${((results.totalContributions + results.totalEmployerContributions) / results.finalPensionNominal) * 100}%`
                  }}
                >
                  <span className="text-xs text-white font-medium px-2 truncate">Investment Growth</span>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-between mt-3 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#FF8C42] mr-1 rounded-sm"></div>
                  <span>Your Contributions: {formatCurrency(Math.round(results.totalContributions))}</span>
                  <span className="ml-1 text-gray-500">
                    ({((results.totalContributions / results.finalPensionNominal) * 100).toFixed(1)}%)
                  </span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#FF5F6D] mr-1 rounded-sm"></div>
                  <span>Employer: {formatCurrency(Math.round(results.totalEmployerContributions))}</span>
                  <span className="ml-1 text-gray-500">
                    ({((results.totalEmployerContributions / results.finalPensionNominal) * 100).toFixed(1)}%)
                  </span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#FF4B6A] mr-1 rounded-sm"></div>
                  <span>Growth: {formatCurrency(Math.round(results.totalInvestmentGrowth))}</span>
                  <span className="ml-1 text-gray-500">
                    ({((results.totalInvestmentGrowth / results.finalPensionNominal) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Additional Information */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 gradient-border">
          <h2 className="text-xl font-semibold mb-4">Understanding Your Pension Projection</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              This calculator provides an estimate of how your pension might grow over time based on your inputs. It takes into account your current pension value, ongoing contributions, and expected investment returns for different asset classes.
            </p>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">Asset Allocation</h3>
            <p>
              Your asset allocation is a key factor in determining your pension's growth potential and risk level:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Stocks/Equities:</strong> Typically offer higher potential returns but with higher volatility. Historically, UK stocks have returned around 5-8% annually over the long term.</li>
              <li><strong>Bonds:</strong> Generally provide more stable returns than stocks but with lower growth potential. UK government bonds have historically returned around 2-4% annually.</li>
              <li><strong>Cash:</strong> The safest asset class with the lowest returns. Cash and cash equivalents typically return 0-2% annually, often below inflation.</li>
            </ul>
            
            <div className="bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg p-4 mt-4">
              <p className="text-sm">
                <strong>Important:</strong> This calculator provides projections based on the assumptions you provide. Actual returns will vary and may be significantly different from these projections. Investment returns are not guaranteed and the value of investments can go down as well as up.
              </p>
            </div>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">Inflation Impact</h3>
            <p>
              The calculator accounts for inflation to show you the "real" value of your pension in today's money. This helps you understand the actual purchasing power your pension will have when you retire.
            </p>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">Typical UK Pension Strategies</h3>
            <p>
              Common asset allocation strategies in the UK often follow age-based guidelines:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Younger investors (20s-40s):</strong> Often allocate 70-80% to stocks, 15-25% to bonds, and 5-10% to cash.</li>
              <li><strong>Mid-career investors (40s-50s):</strong> May shift to 50-70% stocks, 20-40% bonds, and 10-15% cash.</li>
              <li><strong>Near retirement (55+):</strong> Often reduce risk with 30-50% stocks, 40-60% bonds, and 10-20% cash.</li>
              <li><strong>In retirement:</strong> May further reduce risk with 20-40% stocks, 40-60% bonds, and 20-30% cash.</li>
            </ul>
            
            <p className="mt-4">
              Remember that these are general guidelines and your personal circumstances, risk tolerance, and financial goals should inform your investment decisions. Consider consulting with a financial advisor for personalized advice.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
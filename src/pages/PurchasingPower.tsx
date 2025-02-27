import React, { useState, useRef, useEffect } from 'react';
import { PoundSterling, HelpCircle, Calendar, TrendingUp, ArrowRight } from 'lucide-react';

interface FormData {
  amount: number;
  startYear: number;
  endYear: number;
}

interface InputFieldState {
  amount: string;
  startYear: string;
  endYear: string;
}

interface PurchasingPowerResult {
  originalAmount: number;
  adjustedAmount: number;
  percentageChange: number;
  inflationFactor: number;
  averageInflation: number;
  yearlyBreakdown: {
    year: number;
    amount: number;
    inflationRate: number;
  }[];
}

// UK inflation data (RPI) from 1980 to 2024
// Source: Office for National Statistics
const ukInflationData: { [key: number]: number } = {
  1980: 18.0, 1981: 11.9, 1982: 8.6, 1983: 4.6, 1984: 5.0, 1985: 6.1, 
  1986: 3.4, 1987: 4.2, 1988: 4.9, 1989: 7.8, 1990: 9.5, 1991: 5.9, 
  1992: 3.7, 1993: 1.6, 1994: 2.4, 1995: 3.5, 1996: 2.4, 1997: 3.1, 
  1998: 3.4, 1999: 1.5, 2000: 3.0, 2001: 1.8, 2002: 1.7, 2003: 2.9, 
  2004: 3.0, 2005: 2.8, 2006: 3.2, 2007: 4.3, 2008: 4.0, 2009: -0.5, 
  2010: 4.6, 2011: 5.2, 2012: 3.2, 2013: 3.0, 2014: 2.4, 2015: 1.0, 
  2016: 1.8, 2017: 3.6, 2018: 3.3, 2019: 2.6, 2020: 1.5, 2021: 4.1, 
  2022: 9.0, 2023: 6.7, 2024: 3.2
};

// Get the current year
const currentYear = new Date().getFullYear();

// Get the earliest year in our data
const earliestYear = Math.min(...Object.keys(ukInflationData).map(Number));

export function PurchasingPower() {
  // Default values for the calculator
  const [formData, setFormData] = useState<FormData>({
    amount: 1000,
    startYear: 2000,
    endYear: currentYear
  });

  // Input field values (as strings to handle formatting)
  const [inputValues, setInputValues] = useState<InputFieldState>({
    amount: '1,000',
    startYear: '2000',
    endYear: currentYear.toString()
  });

  const [results, setResults] = useState<PurchasingPowerResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<string | null>(null);
  
  // Store cursor position for formatted inputs
  const cursorPositionRef = useRef<number | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({
    amount: null,
    startYear: null,
    endYear: null
  });

  // Calculate results when form data changes
  useEffect(() => {
    calculatePurchasingPower();
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
      const defaultValue = '0';
      setInputValues({
        ...inputValues,
        [name]: defaultValue
      });
      
      // Update the numeric value for calculations
      setFormData({
        ...formData,
        [name]: 0
      });
    } else if (name === 'amount') {
      // Ensure proper formatting on blur for numeric fields
      const numericValue = parseFormattedNumber(value);
      setInputValues({
        ...inputValues,
        [name]: formatNumberWithCommas(numericValue)
      });
    } else if (name === 'startYear' || name === 'endYear') {
      // Validate year inputs
      let numericValue = parseInt(value, 10);
      
      // Ensure years are within valid range
      if (name === 'startYear') {
        numericValue = Math.max(earliestYear, Math.min(numericValue, formData.endYear));
      } else if (name === 'endYear') {
        numericValue = Math.max(formData.startYear, Math.min(numericValue, currentYear));
      }
      
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
    if (name === 'amount') {
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
    } else if (name === 'startYear' || name === 'endYear') {
      // For year fields, only allow digits
      const cleanValue = value.replace(/[^\d]/g, '');
      
      setInputValues({
        ...inputValues,
        [name]: cleanValue
      });
      
      if (cleanValue !== '') {
        const numericValue = parseInt(cleanValue, 10);
        
        // Validate year range
        if (numericValue >= earliestYear && numericValue <= currentYear) {
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
        
        if (name === 'startYear' || name === 'endYear') {
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

  const calculatePurchasingPower = () => {
    setIsCalculating(true);
    
    // Short delay to show calculation animation if needed
    setTimeout(() => {
      try {
        // Get values from form data
        const { amount, startYear, endYear } = formData;
        
        // Ensure years are valid
        const validStartYear = Math.max(earliestYear, Math.min(startYear, endYear));
        const validEndYear = Math.min(currentYear, Math.max(endYear, validStartYear));
        
        // Calculate inflation factor
        let inflationFactor = 1;
        const yearlyBreakdown = [];
        let currentAmount = amount;
        
        // Create yearly breakdown
        for (let year = validStartYear; year <= validEndYear; year++) {
          // Get inflation rate for this year
          const inflationRate = ukInflationData[year] || 2.0; // Use 2% as default if data is missing
          
          // Add to yearly breakdown
          yearlyBreakdown.push({
            year,
            amount: currentAmount,
            inflationRate: inflationRate
          });
          
          // Update current amount for next year
          if (year < validEndYear) {
            currentAmount = currentAmount * (1 + inflationRate / 100);
          }
        }
        
        // Calculate final adjusted amount
        const adjustedAmount = yearlyBreakdown[yearlyBreakdown.length - 1].amount;
        
        // Calculate percentage change
        const percentageChange = ((adjustedAmount - amount) / amount) * 100;
        
        // Calculate average annual inflation
        const yearDiff = validEndYear - validStartYear;
        const averageInflation = yearDiff > 0 
          ? Math.pow(adjustedAmount / amount, 1 / yearDiff) - 1 
          : 0;
        
        setResults({
          originalAmount: amount,
          adjustedAmount,
          percentageChange,
          inflationFactor: adjustedAmount / amount,
          averageInflation: averageInflation * 100,
          yearlyBreakdown
        });
      } catch (error) {
        console.error("Error calculating purchasing power:", error);
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
      case 'amount':
        return 'Enter the amount of money you want to calculate the purchasing power for.';
      case 'startYear':
        return `Enter the starting year (minimum ${earliestYear}). This is the year your money's value is based on.`;
      case 'endYear':
        return `Enter the end year (maximum ${currentYear}). This is the year you want to compare your money's value to.`;
      default:
        return '';
    }
  };

  return (
    <main className="pt-24 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sunset-start via-sunset-middle to-sunset-end flex items-center justify-center mb-6">
            <PoundSterling className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Purchasing Power Calculator</h1>
          <p className="text-gray-600 text-center max-w-2xl">
            Calculate how inflation affects the value of your money over time using UK inflation data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Calculator Form */}
          <div className="md:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl p-6 gradient-border">
            <h2 className="text-xl font-semibold mb-4">Purchasing Power Details</h2>
            
            <div className="space-y-4">
              {/* Amount */}
              <div className="relative">
                <div className="flex items-center mb-1">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <button 
                    type="button"
                    className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                    onClick={() => setShowInfo(showInfo === 'amount' ? null : 'amount')}
                    aria-label="Show information about amount"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                
                {showInfo === 'amount' && (
                  <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                    {getInfoText('amount')}
                  </div>
                )}
                
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">£</span>
                  <input
                    ref={(el) => inputRefs.current.amount = el}
                    type="text"
                    inputMode="numeric"
                    id="amount"
                    name="amount"
                    value={inputValues.amount}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                  />
                </div>
              </div>
              
              {/* Start Year */}
              <div className="relative">
                <div className="flex items-center mb-1">
                  <label htmlFor="startYear" className="block text-sm font-medium text-gray-700">
                    Start Year
                  </label>
                  <button 
                    type="button"
                    className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                    onClick={() => setShowInfo(showInfo === 'startYear' ? null : 'startYear')}
                    aria-label="Show information about start year"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                
                {showInfo === 'startYear' && (
                  <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                    {getInfoText('startYear')}
                  </div>
                )}
                
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    ref={(el) => inputRefs.current.startYear = el}
                    type="text"
                    inputMode="numeric"
                    id="startYear"
                    name="startYear"
                    value={inputValues.startYear}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                    min={earliestYear}
                    max={currentYear}
                  />
                </div>
                {parseInt(inputValues.startYear) < earliestYear && (
                  <p className="text-xs text-sunset-text mt-1">
                    Start year must be {earliestYear} or later (earliest data available).
                  </p>
                )}
              </div>
              
              {/* End Year */}
              <div className="relative">
                <div className="flex items-center mb-1">
                  <label htmlFor="endYear" className="block text-sm font-medium text-gray-700">
                    End Year
                  </label>
                  <button 
                    type="button"
                    className="ml-2 text-gray-400 hover:text-sunset-text transition-colors"
                    onClick={() => setShowInfo(showInfo === 'endYear' ? null : 'endYear')}
                    aria-label="Show information about end year"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
                
                {showInfo === 'endYear' && (
                  <div className="mb-2 p-2 bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg text-sm text-gray-600">
                    {getInfoText('endYear')}
                  </div>
                )}
                
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    ref={(el) => inputRefs.current.endYear = el}
                    type="text"
                    inputMode="numeric"
                    id="endYear"
                    name="endYear"
                    value={inputValues.endYear}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-sunset-start focus:border-sunset-start"
                    min={earliestYear}
                    max={currentYear}
                  />
                </div>
                {parseInt(inputValues.endYear) > currentYear && (
                  <p className="text-xs text-sunset-text mt-1">
                    End year cannot be in the future.
                  </p>
                )}
                {parseInt(inputValues.endYear) < parseInt(inputValues.startYear) && (
                  <p className="text-xs text-sunset-text mt-1">
                    End year must be greater than or equal to start year.
                  </p>
                )}
              </div>
              
              {/* Calculate Button */}
              <div className="mt-6">
                <button
                  onClick={calculatePurchasingPower}
                  disabled={isCalculating || 
                    parseInt(inputValues.startYear) < earliestYear || 
                    parseInt(inputValues.endYear) > currentYear ||
                    parseInt(inputValues.endYear) < parseInt(inputValues.startYear)}
                  className={`w-full gradient-button text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-lg ${
                    isCalculating || 
                    parseInt(inputValues.startYear) < earliestYear || 
                    parseInt(inputValues.endYear) > currentYear ||
                    parseInt(inputValues.endYear) < parseInt(inputValues.startYear)
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                >
                  {isCalculating ? 'Calculating...' : 'Calculate Purchasing Power'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Results Panel */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 gradient-border">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            
            {results ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-sunset-start/10 to-sunset-end/10 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">
                    {formatCurrency(results.originalAmount)} in {formData.startYear} is worth
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(Math.round(results.adjustedAmount))}
                  </p>
                  <p className="text-sm text-gray-600">in {formData.endYear}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Value Change</p>
                    <p className={`text-sm font-medium ${results.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {results.percentageChange >= 0 ? '+' : ''}{formatPercentage(results.percentageChange)}
                    </p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Average Annual Inflation</p>
                    <p className="text-sm font-medium">
                      {formatPercentage(results.averageInflation)}
                    </p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Time Period</p>
                    <p className="text-sm font-medium">
                      {formData.endYear - formData.startYear} years
                    </p>
                  </div>
                  
                  <div className="border-t border-gray-200 my-3"></div>
                  
                  {/* Purchasing Power Visualization */}
                  <div className="bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg p-3">
                    <h3 className="text-sm font-semibold mb-2 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Purchasing Power Change
                    </h3>
                    
                    <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                      {/* Original Value */}
                      <div 
                        className="absolute h-full bg-[#FF8C42]"
                        style={{ 
                          width: `${(100 / results.inflationFactor)}%`,
                          minWidth: '5%',
                          maxWidth: '100%'
                        }}
                      ></div>
                      
                      {/* Value Change Indicator */}
                      {results.percentageChange !== 0 && (
                        <div className="absolute inset-y-0 flex items-center" 
                          style={{ 
                            left: `${(100 / results.inflationFactor)}%`,
                          }}
                        >
                          <ArrowRight className={`w-4 h-4 ${results.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between mt-1 text-xs text-gray-600">
                      <span>{formatCurrency(results.originalAmount)}</span>
                      <span>{formatCurrency(Math.round(results.adjustedAmount))}</span>
                    </div>
                  </div>
                  
                  {/* Yearly Breakdown (limited to 5 entries) */}
                  {results.yearlyBreakdown.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold mb-2">Yearly Breakdown</h3>
                      <div className="max-h-40 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="text-xs text-gray-700">
                            <tr>
                              <th className="text-left py-1">Year</th>
                              <th className="text-right py-1">Value</th>
                              <th className="text-right py-1">Inflation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.yearlyBreakdown.map((item, index) => (
                              <tr key={item.year} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="py-1">{item.year}</td>
                                <td className="text-right py-1">{formatCurrency(Math.round(item.amount))}</td>
                                <td className="text-right py-1">{item.inflationRate.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-gray-500 mb-2">Enter your details and click calculate to see how inflation has affected your money's value.</p>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sunset-start/20 via-sunset-middle/20 to-sunset-end/20 flex items-center justify-center mt-4">
                  <PoundSterling className="w-6 h-6 text-sunset-middle opacity-60" />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Additional Information */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 gradient-border">
          <h2 className="text-xl font-semibold mb-4">Understanding Purchasing Power</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              Purchasing power refers to the value of money in terms of the goods and services it can buy. As prices rise due to inflation, the purchasing power of your money decreases.
            </p>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">About UK Inflation</h3>
            <p>
              This calculator uses historical UK Retail Price Index (RPI) data from the Office for National Statistics. Key periods in UK inflation history include:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>1980s:</strong> High inflation in the early 1980s (18% in 1980) gradually decreased throughout the decade.</li>
              <li><strong>1990s:</strong> Inflation moderated with the introduction of inflation targeting by the Bank of England.</li>
              <li><strong>2000s:</strong> Relatively stable inflation around the 2-3% target, with a spike during the 2008 financial crisis.</li>
              <li><strong>2010s:</strong> Generally low inflation, with a period of higher inflation following the Brexit referendum.</li>
              <li><strong>2020s:</strong> Significant inflation spike in 2021-2023 due to pandemic recovery and energy price increases.</li>
            </ul>
            
            <div className="bg-gradient-to-br from-sunset-start/5 to-sunset-end/5 rounded-lg p-4 mt-4">
              <p className="text-sm">
                <strong>Note:</strong> This calculator uses historical data and provides estimates based on average inflation rates. The actual purchasing power of money can vary based on specific goods and services, regional differences, and individual spending patterns.
              </p>
            </div>
            
            <h3 className="text-lg font-semibold mt-6 mb-2">How to Use This Information</h3>
            <p>
              Understanding how inflation affects your money can help with:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Long-term financial planning:</strong> Ensuring your savings and investments outpace inflation.</li>
              <li><strong>Retirement planning:</strong> Calculating how much your pension will be worth in real terms.</li>
              <li><strong>Salary negotiations:</strong> Understanding if your pay rises are keeping pace with inflation.</li>
              <li><strong>Investment decisions:</strong> Evaluating the real returns on your investments after accounting for inflation.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
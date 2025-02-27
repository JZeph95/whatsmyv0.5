import React, { useState, useEffect, useRef } from 'react';
import { PoundSterling, Home, Car, LineChart, Percent, ChevronDown, Menu, X, LayoutDashboard, CupSoda, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const calculators = [
  {
    name: 'Home',
    icon: LayoutDashboard,
    accent: 'sunset',
    path: '/',
  },
  {
    name: 'Take Home Pay',
    icon: PoundSterling,
    accent: 'sunset',
    path: '/take-home-pay',
  },
  {
    name: 'Mortgage Payment',
    icon: Home,
    accent: 'sunset',
    path: '/mortgage-payment',
  },
  {
    name: 'Car Payment',
    icon: Car,
    accent: 'sunset',
    path: '/car-payment',
  },
  {
    name: 'Pension Projection',
    icon: LineChart,
    accent: 'sunset',
    path: '/pension-projection',
  },
  {
    name: 'Compound Interest',
    icon: Percent,
    accent: 'sunset',
    path: '/compound-interest',
  },
  {
    name: 'Purchasing Power',
    icon: TrendingUp,
    accent: 'sunset',
    path: '/purchasing-power',
  },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
    if (panelRef.current) {
      panelRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    const x = e.touches[0].clientX;
    const walk = x - startX.current;
    
    if (walk > 0) {
      currentX.current = walk;
      if (panelRef.current) {
        panelRef.current.style.transform = `translateX(${walk}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (panelRef.current) {
      panelRef.current.style.transition = 'transform 0.3s ease-out';
      if (currentX.current > 100) {
        setIsMobileMenuOpen(false);
      } else {
        panelRef.current.style.transform = '';
      }
    }
    currentX.current = 0;
  };

  const handleOptionClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className={`
          max-w-7xl mx-auto bg-white/80 backdrop-blur-sm gradient-border
          rounded-[2rem] overflow-hidden
          transition-all duration-300
          ${isScrolled ? 'shadow-lg shadow-black/5' : ''}
        `}>
          <div className="px-4 h-16">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center">
                <button 
                  onClick={() => setIsOpen(!isOpen)}
                  className="group hidden md:flex items-center space-x-3 text-gray-900 transition-colors"
                >
                  <Link to="/" className="logo-text text-xl gradient-text">
                    What's my
                  </Link>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} opacity-60 group-hover:opacity-100`} />
                </button>
                <div className="flex md:hidden items-center space-x-3">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                  >
                    <Menu className="w-6 h-6 text-gray-900" />
                  </button>
                  <Link to="/" className="logo-text text-xl gradient-text">What's my</Link>
                </div>
              </div>

              <div className="flex items-center">
                <a 
                  href="https://buymeacoffee.com/whatsmy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#FFDD00] hover:bg-[#FFDD00]/90 active:bg-[#FFDD00]/80
                    inline-flex items-center px-6 py-2 rounded-[1.25rem] text-black
                    transition-all duration-300 hover:shadow-lg
                    font-medium tracking-tight"
                >
                  <CupSoda className="w-4 h-4" />
                  <span className="ml-2 hidden sm:inline">Buy us a coffee</span>
                </a>
              </div>
            </div>
          </div>

          {/* Desktop dropdown menu */}
          <div 
            className={`
              hidden md:block overflow-hidden transition-all duration-300 ease-in-out
              ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
            `}
          >
            <div className="px-4 py-4 border-t border-gray-100/50">
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                {calculators.map((calc) => (
                  <button
                    key={calc.name}
                    onClick={() => handleOptionClick(calc.path)}
                    className="group flex items-center px-3 py-2 rounded-[1.25rem] bg-white/90
                      border border-transparent hover:border-sunset-start/10
                      shadow-sm hover:shadow-md hover:shadow-sunset-start/5
                      transition-all duration-200 text-left w-full"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full
                      bg-gradient-to-br from-sunset-start via-sunset-middle to-sunset-end
                      group-hover:scale-110 transition-transform duration-200 mr-2">
                      <calc.icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-900 text-sm font-medium group-hover:translate-x-0.5 transition-transform duration-200">
                      {calc.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile slide-out menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-50 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <div
        ref={panelRef}
        className={`
          fixed top-0 left-0 bottom-0 w-[80vw] max-w-[300px] bg-white z-50 md:hidden
          transform transition-transform duration-300 ease-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Link to="/" className="logo-text text-xl gradient-text">Menu</Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-gray-900" />
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {calculators.map((calc) => (
              <button
                key={calc.name}
                onClick={() => handleOptionClick(calc.path)}
                className="flex items-center p-3 rounded-[1.25rem] hover:bg-gray-50 active:bg-gray-100
                  transition-colors min-h-[40px] w-full text-left"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full
                  bg-gradient-to-br from-sunset-start via-sunset-middle to-sunset-end mr-2">
                  <calc.icon className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-900 text-sm font-medium">{calc.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
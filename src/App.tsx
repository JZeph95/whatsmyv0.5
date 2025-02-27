import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { TakeHomePay } from './pages/TakeHomePay';
import { CompoundInterest } from './pages/CompoundInterest';
import { MortgagePayment } from './pages/MortgagePayment';
import { CarPayment } from './pages/CarPayment';
import { PensionProjection } from './pages/PensionProjection';
import { PurchasingPower } from './pages/PurchasingPower';

function App() {
  const location = useLocation();

  // Scroll to top when location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="relative min-h-screen bg-white">
      <div className="relative">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/take-home-pay" element={<TakeHomePay />} />
          <Route path="/compound-interest" element={<CompoundInterest />} />
          <Route path="/mortgage-payment" element={<MortgagePayment />} />
          <Route path="/car-payment" element={<CarPayment />} />
          <Route path="/pension-projection" element={<PensionProjection />} />
          <Route path="/purchasing-power" element={<PurchasingPower />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
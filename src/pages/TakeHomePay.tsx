import React from 'react';
import { PoundSterling } from 'lucide-react';

export function TakeHomePay() {
  return (
    <main className="pt-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sunset-start via-sunset-middle to-sunset-end flex items-center justify-center mb-6">
            <PoundSterling className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Take Home Pay Calculator</h1>
          <div className="w-full max-w-lg mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 gradient-border">
              <p className="text-xl text-gray-600 mb-2">Coming Soon!</p>
              <p className="text-gray-500">We're working hard to bring you an accurate and easy-to-use take home pay calculator.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
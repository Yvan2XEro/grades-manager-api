import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-primary-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary-700" />
        <h2 className="text-xl font-semibold text-primary-800">Loading...</h2>
      </div>
    </div>
  );
};

export default LoadingScreen;
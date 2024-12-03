import React, { useState, useEffect } from 'react';

interface HydrationBarrierProps {
  children: React.ReactNode;
}

const HydrationBarrier: React.FC<HydrationBarrierProps> = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return <div className="hydration-placeholder">Loading editor...</div>;
  }

  return <>{children}</>;
};

export default HydrationBarrier;
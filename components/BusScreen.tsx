import React from 'react';

export interface BusScreenProps {
  children?: React.ReactNode;
  className?: string;
}

const BusScreen: React.FC<BusScreenProps> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export default BusScreen;

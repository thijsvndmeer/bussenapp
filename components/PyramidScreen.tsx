import React from 'react';

export interface PyramidScreenProps {
  children?: React.ReactNode;
  className?: string;
}

const PyramidScreen: React.FC<PyramidScreenProps> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export default PyramidScreen;

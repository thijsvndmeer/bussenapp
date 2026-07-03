import React from 'react';

export interface SettingsPanelProps {
  children?: React.ReactNode;
  className?: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export default SettingsPanel;

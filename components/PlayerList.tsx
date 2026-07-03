import React from 'react';

export interface PlayerListProps {
  children?: React.ReactNode;
  className?: string;
}

const PlayerList: React.FC<PlayerListProps> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export default PlayerList;

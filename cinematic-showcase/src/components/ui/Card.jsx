import React from 'react';
import clsx from 'clsx';

export default function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={clsx(
        'glass-card rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01] hover:border-white/10 shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

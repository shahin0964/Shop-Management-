import React from 'react';
import { cn } from '../../lib/utils.ts';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  ...props
}) => {
  const baseStyles = 'bg-white rounded-xl transition-shadow';

  const variantStyles = {
    default: 'border border-slate-200/80 shadow-xs',
    flat: 'bg-slate-50 border border-slate-200',
    bordered: 'border-2 border-slate-200',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={cn(baseStyles, variantStyles[variant], paddingStyles[padding], className)} {...props}>
      {children}
    </div>
  );
};

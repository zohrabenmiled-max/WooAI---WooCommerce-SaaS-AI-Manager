import React from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-400/20 shadow-lg shadow-indigo-900/20',
      secondary: 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700',
      outline: 'border border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-300 hover:text-white',
      ghost: 'hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300',
    };
    
    const sizes = {
      sm: 'px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
      md: 'px-4 py-2 text-xs font-semibold',
      lg: 'px-6 py-3 text-sm font-bold',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
          className
        )}
        {...props}
      />
    );
  }
);

export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden', className)} {...props}>
    {children}
  </div>
);

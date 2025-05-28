import React from 'react';
import { XMarkIcon } from './Icons';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', leftIcon, rightIcon, className, children, ...props }) => {
  const baseStyles = 'font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ease-in-out inline-flex items-center justify-center';
  
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-200 focus:ring-primary',
    outline: 'bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-primary',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden`}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            <XMarkIcon className="w-6 h-6" />
          </Button>
        </div>
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

interface BadgeProps {
  color?: 'sky' | 'emerald' | 'amber' | 'red' | 'slate';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ color = 'sky', children, className }) => {
  const colorStyles = {
    sky: 'bg-sky-100 text-sky-700 border-sky-300',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    amber: 'bg-amber-100 text-amber-700 border-amber-300',
    red: 'bg-red-100 text-red-700 border-red-300',
    slate: 'bg-slate-100 text-slate-700 border-slate-300',
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${colorStyles[color]} ${className}`}>
      {children}
    </span>
  );
};

export const LoadingSpinner: React.FC<{size?: 'sm' | 'md' | 'lg'}> = ({size = 'md'}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeClasses[size]} border-4 border-slate-200 border-t-primary rounded-full animate-spin`}></div>
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, error, className, ...props }) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <input
      id={id}
      className={`block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${error ? 'border-red-500' : ''} ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, error, className, ...props }) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <textarea
      id={id}
      rows={4}
      className={`block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${error ? 'border-red-500' : ''} ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{value: string; label: string}>;
}
export const Select: React.FC<SelectProps> = ({ label, id, error, options, className, ...props }) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <select
      id={id}
      className={`block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${error ? 'border-red-500' : ''} ${className}`}
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);
    
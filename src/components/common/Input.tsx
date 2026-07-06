import React, { useId } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input: React.FC<InputProps> = ({ label, error, hint, className = '', id, ...props }) => {
  const generatedId = useId()
  const inputId = id || generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
          {label}
          {props.required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...props}
        className={`input-base text-base py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60 disabled:cursor-not-allowed ${error ? 'border-danger focus:ring-danger focus:border-danger' : ''} ${className}`}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger flex items-center gap-1">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-xs text-text-tertiary">
          {hint}
        </p>
      )}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, hint, className = '', id, ...props }) => {
  const generatedId = useId()
  const inputId = id || generatedId
  const errorId = `${inputId}-error`
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
          {label}
          {props.required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={3}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
        className={`input-base text-base py-2.5 resize-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60 disabled:cursor-not-allowed ${error ? 'border-danger' : ''} ${className}`}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-text-tertiary">{hint}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select: React.FC<SelectProps> = ({ label, error, options, placeholder, className = '', id, ...props }) => {
  const generatedId = useId()
  const inputId = id || generatedId
  const errorId = `${inputId}-error`
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
          {label}
          {props.required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
        className={`input-base text-base py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60 disabled:cursor-not-allowed ${error ? 'border-danger' : ''} ${className}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

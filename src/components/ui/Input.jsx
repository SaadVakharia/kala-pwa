export const Input = ({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  autoComplete,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-kala-dark">
          {label}
        </label>
      )}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className={`
          w-full px-4 py-3 rounded-lg border bg-white text-kala-dark
          placeholder:text-gray-400 text-base
          focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent
          transition-all duration-150
          ${error ? 'border-red-500' : 'border-kala-border'}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

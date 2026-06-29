export const Input = ({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  autoComplete,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  prefix,
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
          {label}
        </label>
      )}
      <div className="relative w-full">
        {prefix ? (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 border-r border-gray-200 pr-3 z-10 pointer-events-none">
            {prefix}
          </div>
        ) : LeftIcon ? (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 flex items-center justify-center">
            <LeftIcon size={18} />
          </div>
        ) : null}

        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`
            w-full py-3 px-4 rounded-xl border bg-gray-50 text-kala-dark text-sm font-medium
            placeholder:text-gray-400 placeholder:font-normal
            focus:outline-none focus:ring-2 focus:ring-kala-red focus:border-transparent
            transition-all duration-150
            ${prefix ? 'pl-24' : LeftIcon ? 'pl-11' : 'pl-4'}
            ${RightIcon ? 'pr-12' : 'pr-4'}
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-kala-red'}
            ${className}
          `}
          {...props}
        />

        {RightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 flex items-center justify-center">
            {RightIcon}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}


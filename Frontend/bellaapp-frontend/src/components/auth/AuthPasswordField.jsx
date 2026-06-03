import { Eye, EyeOff } from "lucide-react";

export default function AuthPasswordField({
  fieldId,
  fieldName,
  helperText = "",
  label,
  onToggleVisibility,
  onValueChange,
  placeholder,
  showPassword,
  toggleLabel,
  value,
  required = true,
}) {
  return (
    <div className="form-group">
      <label htmlFor={fieldId}>{label}</label>
      <div className="password-field">
        <input
          id={fieldId}
          name={fieldName}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onValueChange}
          required={required}
        />

        <button
          type="button"
          className="password-toggle"
          aria-label={toggleLabel}
          aria-pressed={showPassword}
          onClick={onToggleVisibility}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {helperText ? <small className="auth-helper">{helperText}</small> : null}
    </div>
  );
}

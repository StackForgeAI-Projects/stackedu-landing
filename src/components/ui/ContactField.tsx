type ContactFieldProps = {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
};

export function ContactField({
  label,
  name,
  placeholder,
  type = "text",
  required = true,
  value,
  onChange,
}: ContactFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block eyebrow tracking-[0.18em] text-white/60 mb-2"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/40 border border-white/10 rounded-full px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-primary-bright transition-colors"
      />
    </div>
  );
}

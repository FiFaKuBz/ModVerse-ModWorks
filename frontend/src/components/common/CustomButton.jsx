// src/components/common/CustomButton.jsx
export default function CustomButton({ children, variant = "secondary", onClick }) {
  const base =
    "w-[149px] h-[57px] rounded-[20px] text-sm font-medium flex items-center justify-center transition";

  const variants = {
    share: `${base} border border-mOrange text-black bg-white hover:bg-orange-50`,
    edit: `${base} border border-black bg-mOrange text-black hover:bg-orange-700`,
  };

  return (
    <button onClick={onClick} className={variants[variant]}>
      {children}
    </button>
  );
}

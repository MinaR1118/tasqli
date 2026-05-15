interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={[
        "rounded-xl border border-gray-200 bg-white p-6 shadow-sm",
        className,
      ].join(" ")}
    >
      {title && (
        <h2 className="mb-4 text-base font-semibold text-gray-900">{title}</h2>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="lg-stat">
      <div className="lg-stat__label">{label}</div>
      <div className="lg-stat__value">{value}</div>
      {hint ? <div className="lg-stat__hint">{hint}</div> : null}
    </div>
  );
}

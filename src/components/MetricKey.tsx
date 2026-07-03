const metricKeyItems = [
  { code: "Pts", label: "points" },
  { code: "CS", label: "clean sheet" },
  { code: "W/D/L", label: "wins, draws, losses" },
];

export function MetricKey({ className = "" }: { className?: string }) {
  return (
    <details className={["metric-key", className].filter(Boolean).join(" ")}>
      <summary>Key</summary>
      <div>
        {metricKeyItems.map((item) => (
          <span key={item.code}>
            <b>{item.code}</b>
            {item.label}
          </span>
        ))}
      </div>
    </details>
  );
}

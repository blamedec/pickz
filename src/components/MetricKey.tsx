const metricKeyItems = [
  { code: "Pts", label: "points" },
  { code: "GF", label: "goals for" },
  { code: "GA", label: "goals against" },
  { code: "CS", label: "clean sheets" },
  { code: "RC", label: "red cards" },
  { code: "OG", label: "own goals" },
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

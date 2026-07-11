export default function Rating({
  value,
  count,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold text-amber-500 ${
        size === "sm" ? "text-xs" : "text-sm"
      }`}
    >
      <span aria-hidden="true">★</span>
      <span>{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-gray-400">({count})</span>
      )}
    </span>
  );
}

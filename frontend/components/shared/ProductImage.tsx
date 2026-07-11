// بديل صورة المنتج (رمز تعبيري داخل خلفية متدرّجة) حتى تُضاف الصور الحقيقية في public/images
export default function ProductImage({
  emoji,
  alt,
  className = "",
  size = "md",
}: {
  emoji: string;
  alt: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const text = size === "lg" ? "text-7xl" : size === "sm" ? "text-4xl" : "text-6xl";
  return (
    <div
      role="img"
      aria-label={alt}
      className={`grid place-items-center bg-gradient-to-br from-brand-light/30 to-brand/20 ${text} ${className}`}
    >
      <span aria-hidden="true">{emoji}</span>
    </div>
  );
}

// صورة المنتج: تعرض الصورة المرفوعة إن وُجدت، وإلا رمزًا تعبيريًا داخل خلفية متدرّجة
export default function ProductImage({
  emoji,
  src,
  alt,
  className = "",
  size = "md",
}: {
  emoji: string;
  src?: string;
  alt: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`object-cover ${className}`} />;
  }
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

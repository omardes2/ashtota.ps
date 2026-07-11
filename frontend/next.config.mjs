/** @type {import('next').NextConfig} */
const nextConfig = {
  // تصدير ثابت (static export) لنشره على استضافة هوستنجر PHP في public_html
  output: "export",
  // أسماء مجلدات بشرطة مائلة حتى تعمل المسارات على الاستضافة المشتركة
  trailingSlash: true,
  images: {
    // مطلوب مع static export
    unoptimized: true,
  },
};

export default nextConfig;

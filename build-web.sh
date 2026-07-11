#!/usr/bin/env bash
# بناء واجهة Next.js وتصديرها إلى جذر المستودع (public_html) بجانب api/ و admin/
# الاستخدام: bash build-web.sh
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/frontend"

echo "▶ تثبيت الحزم (إن لزم)…"
[ -d node_modules ] || npm install

echo "▶ بناء وتصدير Next.js…"
npm run build

cd "$ROOT"

echo "▶ إزالة المخرجات القديمة من الجذر…"
# ملفات/مجلدات الإخراج الثابت السابقة (يُعاد توليدها). لا نلمس api/ admin/ frontend/ والوثائق.
rm -rf _next product products cart checkout order-success track-order offers \
       branches about contact account login register 404 index.txt \
       404.html index.html favicon.ico

echo "▶ نسخ الإخراج الجديد إلى الجذر…"
cp -r frontend/out/. "$ROOT"/

echo "✅ تم. الجذر الآن يحتوي واجهة Next.js المصدّرة + api/ + admin/"

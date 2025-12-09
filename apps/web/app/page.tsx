import { redirect } from 'next/navigation';

// Ensure the root path (/) exists at build time and redirects
// to the default locale. With current i18n settings (defaultLocale: 'es'
// and localePrefix: 'as-needed'), this will redirect to /es which
// next-intl will then normalize back to /. This avoids transient 404s
// while keeping behavior consistent.
export default function RootRedirect() {
  redirect('/es');
}

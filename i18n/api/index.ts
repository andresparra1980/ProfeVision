import { NextRequest } from 'next/server';

export type ApiLocale = 'es' | 'en';

const SUPPORTED_LOCALES: ApiLocale[] = ['es', 'en'];

function parseAcceptLanguage(headerValue: string | null): ApiLocale | null {
  if (!headerValue) return null;
  const parts = headerValue.split(',').map((p) => p.trim().toLowerCase());
  for (const part of parts) {
    if (part.startsWith('en')) return 'en';
    if (part.startsWith('es')) return 'es';
  }
  return null;
}

export function resolveApiLocale(request: NextRequest): ApiLocale {
  // 1) Query param has priority
  const url = new URL(request.url);
  const queryLocale = url.searchParams.get('locale');
  if (queryLocale && SUPPORTED_LOCALES.includes(queryLocale as ApiLocale)) {
    return queryLocale as ApiLocale;
  }

  // 2) Headers from app middleware or clients
  const headerLocale =
    request.headers.get('x-next-intl-locale') ||
    request.headers.get('x-locale');
  if (headerLocale && SUPPORTED_LOCALES.includes(headerLocale as ApiLocale)) {
    return headerLocale as ApiLocale;
  }

  // 3) Accept-Language
  const acceptLanguage = parseAcceptLanguage(request.headers.get('accept-language'));
  if (acceptLanguage) return acceptLanguage;

  // 4) Default
  return 'es';
}

export type ApiMessages = Record<string, string> & {
  errors?: Record<string, string>;
};

export async function getApiMessages(namespace: string, locale: ApiLocale): Promise<ApiMessages> {
  try {
    // Namespace uses dot notation, map to file path, e.g. exams.details -> locales/{locale}/exams.details.json
    const messages = (await import(`./locales/${locale}/${namespace}.json`)).default as ApiMessages;
    return messages;
  } catch {
    // If route has no messages, return empty to avoid breaking
    return {} as ApiMessages;
  }
}

export async function getApiTranslator(request: NextRequest, namespace: string) {
  const locale = resolveApiLocale(request);
  const messages = await getApiMessages(namespace, locale);

  const access = (key: string): string | undefined => {
    // support nested access like 'errors.someKey'
    const parts = key.split('.');
    let current: unknown = messages;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return typeof current === 'string' ? current : undefined;
  };

  const t = (key: string, fallback?: string): string => access(key) ?? fallback ?? key;

  return { t, locale };
}



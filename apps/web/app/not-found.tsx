import { ForceRefreshButton } from "@/components/shared/force-refresh-button";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AuthProvider } from "@/components/shared/auth-provider";
import { ClientLayout } from "@/components/shared/client-layout";

// Evita que esta página se cachee y que se sirvan 404s obsoletos
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function NotFound() {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("not-found");
  const homeHref = locale === 'es' ? '/' : `/${locale}`;
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthProvider>
        <ClientLayout>
          <SiteHeader />
          <div className="pt-16">
            <div className="container mx-auto px-4 py-8"> 
                <h1 className="text-4xl font-bold text-center mb-4">{t("title")}</h1>
                <p className="text-lg text-muted-foreground text-center mb-8">{t("description")}</p>

                <div className="max-w-4xl mx-auto">
                <div className="bg-card p-6 rounded-lg border">
                    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <ForceRefreshButton href={homeHref}>
                        {t("forceRefresh")}
                    </ForceRefreshButton>
                    </div>
                    <p className="mt-4 text-center text-xs text-muted-foreground">{t("tip")}</p>
                </div>
                </div>
            </div>
          </div>
          <SiteFooter />
        </ClientLayout>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}

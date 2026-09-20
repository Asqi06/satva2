import Script from "next/script";
import { getClientEnv } from "@/lib/env";

/**
 * GA4 loader. Rendered only when NEXT_PUBLIC_GA_ID is set; page_view
 * is automatic. Commerce events fire from features via lib/analytics.
 */
export function AnalyticsLoader() {
  const gaId = getClientEnv().NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />
      <Script id="ga4-init" strategy="lazyOnload">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{send_page_view:true});`}
      </Script>
    </>
  );
}

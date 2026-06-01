import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";

interface SeoSettings {
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_image_url: string | null;
  google_site_verification: string | null;
  bing_site_verification: string | null;
  ga4_measurement_id: string | null;
  gtm_container_id: string | null;
  meta_pixel_id: string | null;
}

/**
 * Injeta as tags de SEO configuradas no painel admin (Meta, verificação,
 * GA4, GTM, Meta Pixel) nas páginas públicas.
 */
export function SeoHead() {
  const [s, setS] = useState<SeoSettings | null>(null);

  useEffect(() => {
    supabase
      .from("seo_settings")
      .select(
        "meta_title, meta_description, meta_keywords, og_image_url, google_site_verification, bing_site_verification, ga4_measurement_id, gtm_container_id, meta_pixel_id"
      )
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setS(data as SeoSettings));
  }, []);

  if (!s) return null;

  return (
    <Helmet>
      {s.meta_title && <title>{s.meta_title}</title>}
      {s.meta_description && <meta name="description" content={s.meta_description} />}
      {s.meta_keywords && <meta name="keywords" content={s.meta_keywords} />}
      {s.meta_title && <meta property="og:title" content={s.meta_title} />}
      {s.meta_description && <meta property="og:description" content={s.meta_description} />}
      {s.og_image_url && <meta property="og:image" content={s.og_image_url} />}
      {s.og_image_url && <meta name="twitter:image" content={s.og_image_url} />}

      {s.google_site_verification && (
        <meta name="google-site-verification" content={s.google_site_verification} />
      )}
      {s.bing_site_verification && <meta name="msvalidate.01" content={s.bing_site_verification} />}

      {s.meta_pixel_id && (
        <meta property="facebook-domain-verification" content={s.meta_pixel_id} />
      )}

      {/* Google Analytics 4 */}
      {s.ga4_measurement_id && (
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${s.ga4_measurement_id}`} />
      )}
      {s.ga4_measurement_id && (
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${s.ga4_measurement_id}');
        `}</script>
      )}

      {/* Google Tag Manager */}
      {s.gtm_container_id && (
        <script>{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
          j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${s.gtm_container_id}');
        `}</script>
      )}

      {/* Meta Pixel */}
      {s.meta_pixel_id && (
        <script>{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${s.meta_pixel_id}');
          fbq('track', 'PageView');
        `}</script>
      )}
    </Helmet>
  );
}

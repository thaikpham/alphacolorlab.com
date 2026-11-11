import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { appInfo, seo, nav } from "./content";
import { AppSidebar, AppTabBar } from "./components/AppNav";
import { SiteHeader } from "./components/SiteHeader";
import { SITE_URL } from "@/lib/site";
import { webSiteLd } from "@/lib/jsonld";
import { JsonLdScript } from "./components/JsonLdScript";



export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: seo.homeTitle,
    template: `%s · ${seo.siteName}`,
  },
  description: appInfo.description,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: seo.siteName,
  },
  twitter: {
    card: "summary_large_image",
  },
  appleWebApp: {
    capable: true,
    title: appInfo.shortName,
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f4f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{const h=document.documentElement,stored=localStorage.getItem('camera-model');h.dataset.model=['a6400','a7c2'].includes(stored)?stored:'zve10';})()`,
          }}
        />
        <link rel="preload" href="/fonts/noto-sans-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/noto-sans-vietnamese.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <JsonLdScript schema={webSiteLd()} />
      </head>
      <body className="bg-bg text-label">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:h-11 focus:px-4 focus:rounded-control focus:bg-card focus:text-label focus:shadow-thumb focus:outline focus:outline-2 focus:outline-accent focus:outline-offset-2 focus:flex focus:items-center">{nav.skipLink}</a>
        <AppSidebar />
        <SiteHeader />
        <div id="main-content" className="pb-16 lg:pb-0" tabIndex={-1}>{children}</div>
        <AppTabBar />
        {/* data-scrolling: đang cuộn (hiện thanh cuộn) · data-nav=hidden: cuộn xuống (ẩn nav) · IntersectionObserver: hiện dần [data-reveal] khi cuộn tới (phần tử đã thấy lúc tải thì bỏ qua) · details anchor: mở details nếu anchor bên trong */}
        <Script id="ui-scroll" strategy="afterInteractive">{`(()=>{let t,y=0;const h=document.documentElement;addEventListener('scroll',e=>{h.dataset.scrolling='';clearTimeout(t);t=setTimeout(()=>delete h.dataset.scrolling,700);if(e.target!==document)return;const n=scrollY;if(n>y&&n>64)h.dataset.nav='hidden';else delete h.dataset.nav;y=n},{passive:true,capture:true});document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute('href').slice(1);const el=document.getElementById(id);if(!el)return;const details=el.closest('details');if(details&&!details.open){details.open=true;requestAnimationFrame(()=>el.scrollIntoView({behavior:'smooth',block:'start'}))}});if(location.hash){const id=location.hash.slice(1);const el=document.getElementById(id);if(el){const details=el.closest('details');if(details&&!details.open){details.open=true;requestAnimationFrame(()=>el.scrollIntoView({behavior:'auto',block:'start'}))}}}if(!matchMedia('(prefers-reduced-motion: reduce)').matches){let first=true;const io=new IntersectionObserver(es=>{for(const x of es)if(x.isIntersecting){const el=x.target;io.unobserve(el);if(!first)el.animate([{opacity:.35,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:700,delay:Math.min(+el.style.getPropertyValue('--i')||0,6)*60,easing:'cubic-bezier(.16,1,.3,1)'})}first=false});document.querySelectorAll('[data-reveal]').forEach(el=>io.observe(el))}})()`}</Script>
        {/* Service worker chỉ chạy ở bản production; ở dev gỡ mọi SW cũ để không phục vụ cache cũ */}
        {process.env.NODE_ENV === "production" ? (
          <Script id="sw-register" strategy="afterInteractive">{`(()=>{if(!navigator.serviceWorker)return;navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(async()=>{const reg=await navigator.serviceWorker.ready;const urls=performance.getEntriesByType('resource').map(e=>e.name).filter(u=>{try{return new URL(u).origin===location.origin}catch{return false}});urls.push(location.href);reg.active?.postMessage({type:'cache-urls',urls})})})();`}</Script>
        ) : (
          <Script id="sw-unregister" strategy="afterInteractive">{`navigator.serviceWorker?.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()))`}</Script>
        )}
      </body>
    </html>
  );
}

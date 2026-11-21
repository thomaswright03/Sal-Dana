import type { ReactNode } from "react";
import { DeferredChat } from "@/components/site/Deferred";
import { Nav } from "@/components/site/Nav";
import { SiteShell } from "@/components/site/SiteShell";
import { Track } from "@/components/site/Track";
import { getPublishedReviews } from "@/lib/site-reviews";
import { faqs, services, site } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HomeAndConstructionBusiness",
      name: site.name,
      legalName: site.legalName,
      description: site.description,
      telephone: "+1-480-479-2342",
      email: site.email,
      founder: { "@type": "Person", name: site.owner },
      areaServed: site.cities.map((name) => ({ "@type": "City", name: `${name}, AZ` })),
      address: { "@type": "PostalAddress", addressRegion: "AZ", addressCountry: "US" },
      makesOffer: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, description: s.blurb },
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export async function SiteLayout({ children }: { children: ReactNode }) {
  const hasReviews = (await getPublishedReviews()).length > 0;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <noscript>
        <style>{`.preloader{display:none!important}`}</style>
      </noscript>
      <SiteShell>
        <Nav hasReviews={hasReviews} />
        {children}
        <DeferredChat />
        <Track />
      </SiteShell>
    </>
  );
}

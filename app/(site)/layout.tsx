import { Chat } from "@/components/site/Chat";
import { Nav } from "@/components/site/Nav";
import { SiteShell } from "@/components/site/SiteShell";
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

export default function SiteLayout({ children }: LayoutProps<"/">) {
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
        <Nav />
        {children}
        <Chat />
      </SiteShell>
    </>
  );
}

import { Area } from "@/components/site/Area";
import { Booking } from "@/components/site/Booking";
import { Faq } from "@/components/site/Faq";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { Manifesto } from "@/components/site/Manifesto";
import { Marquee } from "@/components/site/Marquee";
import { Reviews } from "@/components/site/Reviews";
import { Process } from "@/components/site/Process";
import { Services } from "@/components/site/Services";
import { Standard } from "@/components/site/Standard";
import { getPublishedReviews } from "@/lib/site-reviews";
import { copy } from "@/lib/copy";
import type { Locale } from "@/lib/i18n";

/** The whole public page. The same sections render in either language; only the words change. */
export async function Home({ locale }: { locale: Locale }) {
  const reviews = await getPublishedReviews();
  return (
    <>
      <main>
        <Hero />
        <Marquee items={copy[locale].services.list.map((s) => s.title)} />
        <Manifesto />
        <Services />
        <Process />
        <Standard />
        {/* Appears once the owner has switched on at least one review in the dashboard. */}
        {reviews.length > 0 && <Reviews reviews={reviews} />}
        <Area />
        <Booking />
        <Faq />
      </main>
      <Footer />
    </>
  );
}

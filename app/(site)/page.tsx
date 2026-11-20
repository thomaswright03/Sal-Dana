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
import { DEMO_MODE, sampleReviews } from "@/lib/demo";
import { services } from "@/lib/site";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Marquee items={services.map((s) => s.title)} />
        <Manifesto />
        <Services />
        <Process />
        <Standard />
        {/* Until real reviews are added, this section only appears in preview mode. */}
        {DEMO_MODE && <Reviews reviews={sampleReviews} />}
        <Area />
        <Booking />
        <Faq />
      </main>
      <Footer />
    </>
  );
}

import { Area } from "@/components/site/Area";
import { Booking } from "@/components/site/Booking";
import { Faq } from "@/components/site/Faq";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { Manifesto } from "@/components/site/Manifesto";
import { Marquee } from "@/components/site/Marquee";
import { Process } from "@/components/site/Process";
import { Services } from "@/components/site/Services";
import { Standard } from "@/components/site/Standard";
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
        <Area />
        <Booking />
        <Faq />
      </main>
      <Footer />
    </>
  );
}

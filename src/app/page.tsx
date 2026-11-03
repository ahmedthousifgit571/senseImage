import SpecDrawer from '@/components/forms/SpecDrawer';
import About from '@/components/sections/About';
import Contact from '@/components/sections/Contact';
import Demo from '@/components/sections/Demo';
import Fleet from '@/components/sections/Fleet';
import Footer from '@/components/sections/Footer';
import Hero from '@/components/sections/Hero';
import IndraKavach from '@/components/sections/IndraKavach';
import Industries from '@/components/sections/Industries';
import Shift from '@/components/sections/Shift';
import System from '@/components/sections/System';

export default function Home() {
  return (
    <>
      <main id="main">
        {/* The hero stays pinned under the about sheet, which slides over it like a curtain. */}
        <div className="relative">
          <Hero />
          <About />
        </div>
        <IndraKavach />
        <Fleet />
        <System />
        <Shift />
        <Industries />
        <Demo />
        <Contact />
      </main>
      <Footer />
      <SpecDrawer />
    </>
  );
}

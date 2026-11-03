import type { Metadata, Viewport } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import Nav from '@/components/chrome/Nav';
import Preloader from '@/components/chrome/Preloader';
import FlightLayer from '@/components/flight/FlightLayer';
import SkyBackdrop from '@/components/flight/SkyBackdrop';
import MissionModeProvider from '@/components/providers/MissionMode';
import SmoothScroll from '@/components/providers/SmoothScroll';
import './globals.css';

// Archivo's width axis carries the aerospace voice: expanded capitals for display, normal width for reading.
const archivo = Archivo({ variable: '--font-archivo', subsets: ['latin'], axes: ['wdth'] });
const jetbrains = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SenseImage Technologies | IndraKavach Counter-UAV Interceptor & Drone Intelligence',
  description:
    "IndraKavach is India's indigenous counter-UAV interceptor drone. SenseImage Technologies builds drones, flies them and delivers the data for defence, infrastructure and government operations.",
};

export const viewport: Viewport = {
  themeColor: '#eae7e0',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-IN" data-mode="day" suppressHydrationWarning className={`${archivo.variable} ${jetbrains.variable}`}>
      {/* Browser extensions (ColorZilla) add attributes to <body>; they aren't app bugs. */}
      <body suppressHydrationWarning>
        {/* Before the browser restores a reload's scroll position: the story always starts at the top. */}
        <Script id="scroll-restoration" strategy="beforeInteractive">
          {`history.scrollRestoration = 'manual'`}
        </Script>
        <a
          href="#main"
          className="sr-only z-[120] rounded-full bg-white px-5 py-3 text-sm text-black focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2"
        >
          Skip to content
        </a>
        <MissionModeProvider>
          <SmoothScroll>
            <SkyBackdrop />
            <Preloader />
            <Nav />
            {children}
            <FlightLayer />
          </SmoothScroll>
        </MissionModeProvider>
      </body>
    </html>
  );
}

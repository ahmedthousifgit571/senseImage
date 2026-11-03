'use client';

import dynamic from 'next/dynamic';

// three.js only ever runs in the browser, and in its own chunk so the page shell paints first.
const FlightCanvas = dynamic(() => import('./FlightCanvas'), { ssr: false });

export default function FlightLayer() {
  return <FlightCanvas />;
}

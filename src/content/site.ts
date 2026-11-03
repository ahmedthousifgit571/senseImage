// Every fact here is taken from senseimage.in (home, /about, /contact, /defence/indrakavach and
// the four product pages), checked on 2026-11-02. Where the pitch brief disagreed with the live
// site, the live site wins. Images are SenseImage's own, synced by scripts/fetch-assets.mjs.

export const company = {
  name: 'SenseImage Technologies',
  short: 'SenseImage',
  email: 'info@senseimage.in',
  phone: '+91 97892 47870',
  phoneHref: 'tel:+919789247870',
  hours: 'Mon – Fri, 10:00 AM – 6:00 PM IST',
  replyTime: 'We reply within one business day.',
  address: ['No. 183, 9th Cross Street,', 'Sea View Enclave, Padur, OMR,', 'Chennai 603 103, Tamil Nadu, India'],
  coords: { lat: '12.8230° N', lon: '80.2294° E', label: 'CHENNAI' },
  footerBlurb: 'A team of GIS experts, pilots and engineers using drones for precision aerial intelligence.',
  terms: 'https://www.senseimage.in/terms-and-conditions',
  socials: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/senseimage/' },
    { label: 'YouTube', href: 'https://www.youtube.com/@senseimage8091/' },
    { label: 'Instagram', href: 'https://www.instagram.com/senseimagetech/' },
    { label: 'X', href: 'https://x.com/senseimagetech' },
    { label: 'Facebook', href: 'https://www.facebook.com/senseimagetech' },
  ],
} as const;

export const nav = [
  { label: 'IndraKavach', href: '#indrakavach' },
  { label: 'Fleet', href: '#fleet' },
  { label: 'Industries', href: '#industries' },
  { label: 'Field demo', href: '#demo' },
  { label: 'Contact', href: '#contact' },
] as const;

export const hero = {
  eyebrow: 'Counter-UAV interceptor',
  title: 'IndraKavach',
  line: 'Autonomous airspace shield.',
  ctas: [
    { label: 'Explore the platform', href: '#indrakavach' },
    { label: 'Schedule a field demo', href: '#demo' },
  ],
  caption: ["India's indigenous counter-UAV interceptor drone.", 'Built for GPS-denied and electronic-warfare skies.'],
  labels: { left: 'Counter-UAV', middle: 'Made in India' },
};

export const about = {
  title: ['We build drones.', 'Fly them. Deliver the data.'],
  statement:
    'SenseImage Technologies is an indigenous drone intelligence company serving defence, critical infrastructure and government operations across India and beyond.',
  chip: { src: '/media/hero/ik-flight.webp', alt: 'IndraKavach in flight over desert terrain' },
  // Scattered around the title like prints on a light table.
  collage: [
    { src: '/media/pillars/border.webp', alt: 'IndraKavach over a desert forward base' },
    { src: '/media/usecases/thermal.webp', alt: 'Thermal inspection drone at a substation' },
    { src: '/media/pillars/powerline.webp', alt: 'Hexacopter inspecting transmission towers at sunrise' },
    { src: '/media/usecases/lidar.webp', alt: 'Topographic LiDAR mapping flight' },
    { src: '/media/industries/mining.webp', alt: 'Survey drone over an open-pit mine' },
    { src: '/media/pillars/cuav.webp', alt: 'Interceptor formation over snow-capped mountains' },
    { src: '/media/usecases/pipeline.webp', alt: 'Corridor surveillance along a pipeline' },
  ],
};

export const stats = [
  { value: 8, suffix: '', unit: 'Years', label: 'Operational' },
  { value: 5, suffix: '', unit: 'Countries', label: 'Deployed' },
  { value: 100, suffix: '+', unit: 'Projects', label: 'Delivered' },
  { value: 1300, suffix: '+', unit: 'Sq km', label: 'Mapped' },
  { value: 1000, suffix: '+', unit: 'Km', label: 'Power lines surveyed' },
];

export const journey = [
  { year: '2012', text: 'UAV research begins' },
  { year: '2017', text: 'SenseImage founded' },
  { year: '100+', text: 'Projects delivered' },
  { year: '25+', text: 'Clients served' },
  { year: 'Pan-India', text: 'Operations' },
];

export const clients = [
  { name: 'Tata Power', logo: '/media/clients/tata-power.webp', w: 600, h: 351 },
  { name: 'Larsen & Toubro', logo: '/media/clients/lt.webp', w: 600, h: 230 },
  { name: 'KEC International', logo: '/media/clients/kec.webp', w: 600, h: 389 },
  { name: 'Kalpataru', logo: '/media/clients/kalpataru.webp', w: 600, h: 118 },
  // senseimage.in names ULTS but publishes no logo file, so it is set as a wordmark.
  { name: 'ULTS', logo: null, w: 0, h: 0 },
  { name: 'Keltron', logo: '/media/clients/keltron.webp', w: 600, h: 159 },
] as const;

export const recognitions = [
  { name: 'CITBIF Incubated', logo: '/media/recognitions/r1.webp' },
  { name: 'ADART — Association for Drone Avionics Research and Testing', logo: '/media/recognitions/r2.webp' },
  { name: 'Chennai Institute of Technology', logo: '/media/recognitions/r3.webp' },
  { name: 'GeM — Government e-Marketplace', logo: '/media/recognitions/r4.webp' },
  { name: 'DGCA', logo: '/media/recognitions/r5.webp' },
  { name: 'Make in India', logo: '/media/recognitions/r6.webp' },
];

export const certifications = [
  { name: 'ISO 27001:2013 certified', logo: '/media/certs/c1.webp' },
  { name: 'ISO 9001:2015 certified', logo: '/media/certs/c2.webp' },
  { name: 'Quality Research Organization', logo: '/media/certs/c3.webp' },
  { name: 'DGCA Type Certified', logo: '/media/certs/c4.webp' },
];

export const indrakavach = {
  marquee: 'IndraKavach',
  enter: 'Scroll to enter',
  title: 'Built to intercept.',
  titleDim: 'Not just detect.',
  body:
    'Conventional counter-drone systems usually stop at detection. IndraKavach, developed in India for defence use, adds autonomous interception in contested environments where GPS, communications and electronic warfare defeat other platforms.',
  // The seven capabilities, in the order the 3D walkthrough presents them.
  steps: [
    {
      title: 'Autonomous Interception',
      caption: 'Intercepts and neutralises hostile UAVs',
      text: 'Built to intercept and neutralise hostile UAVs in active operational environments.',
    },
    {
      title: 'GPS-Denied Navigation',
      caption: 'Visual SLAM when signals are jammed',
      text: 'Navigates autonomously in GPS-denied and electronic-warfare, signal-jammed environments.',
    },
    {
      title: 'AI-Powered Targeting',
      caption: 'Identify, lock, track',
      text: 'Real-time computer vision identifies, locks onto and tracks aerial threats autonomously.',
    },
    {
      title: 'EO/IR Thermal Sensors',
      caption: 'Visibility after dark',
      text: 'Electro-optical and infrared systems maintain visibility in low light and adverse conditions.',
    },
    {
      title: 'Swarm Intelligence',
      caption: 'One operator, many interceptors',
      text: 'Single-operator command and control of multiple interceptor units simultaneously.',
    },
    {
      title: 'Modular Payload',
      caption: 'Kinetic or electronic, up to 2 kg',
      text: 'Mission-specific kinetic or electronic countermeasure configurations, up to 2 kg.',
    },
    {
      title: 'Rapid Field Deployment',
      caption: 'Continuous operational readiness',
      text: 'Continuous operational readiness for border security, military bases, airports and oil & gas facilities.',
    },
  ],
  highlights: ['Payload up to 2 kg', 'Visual SLAM navigation', 'Radar & RF integration'],
  architecture: [
    { title: 'Drone Platform', text: 'High-speed interceptor airframe.' },
    { title: 'Detection System Integration', text: 'Compatible with radar and RF detection.' },
    { title: 'Ground Control Station', text: 'A single operator controls multiple interceptors.' },
    { title: 'Secure Communication Link', text: 'Secure under electronic warfare conditions.' },
  ],
  reliability: [
    { title: 'Mission-Ready Design', text: 'Robust flight control, autonomous navigation and a mission-focused architecture for defence and security work.' },
    { title: 'Secure Communications', text: 'Secure command and control in electronically contested environments.' },
    { title: 'Autonomous Fail-Safe', text: 'Controlled flight and mission continuity during communication loss or unexpected events.' },
  ],
  applications: [
    { title: 'Border Security', text: 'Stops cross-border UAV intrusions.' },
    { title: 'Military Installations', text: 'Protects strategic defence assets.' },
    { title: 'Critical Infrastructure', text: 'Secures high-value national assets.' },
    { title: 'Airports & Airbases', text: 'Guards restricted airspace.' },
    { title: 'Oil & Gas Facilities', text: 'Secures pipeline perimeters.' },
    { title: 'Government & Homeland Security', text: 'Supports VIP and public security.' },
  ],
  faq: [
    { q: 'Can it operate without GPS?', a: 'Yes. IndraKavach navigates with Visual SLAM and terrain-based navigation, so it keeps flying when GPS is denied or jammed.' },
    { q: 'How is targeting achieved?', a: 'AI targeting combined with EO/IR sensors identifies and tracks aerial threats in real time.' },
    { q: 'What systems does it integrate with?', a: 'Radar and RF-based detection systems, and existing defence command workflows.' },
    { q: 'What is the payload capacity?', a: 'Up to 2 kg, including EO/IR systems and onboard intelligence modules.' },
  ],
};

export type Platform = {
  id: string;
  name: string;
  role: string;
  tagline: string;
  image: string;
  alt: string;
  specs: { label: string; value: string }[];
  features: string[];
  typeCertified?: boolean;
};

export const platforms: Platform[] = [
  {
    id: 'indrakavach',
    name: 'IndraKavach',
    role: 'Counter-UAV interceptor drone',
    tagline: 'Built to intercept. Not just detect.',
    image: '/media/hero/indrakavach.webp',
    alt: 'IndraKavach counter-UAV interceptor drone',
    specs: [
      { label: 'Platform', value: 'Interceptor airframe' },
      { label: 'Max payload', value: 'Up to 2 kg' },
      { label: 'Flight time', value: 'On request' },
      { label: 'Mission', value: 'Defence & airspace security' },
    ],
    features: ['Visual SLAM for GPS-denied flight', 'AI + EO/IR targeting', 'Radar & RF detection integration'],
  },
  {
    id: 'skycopter-a6',
    name: 'Skycopter A6',
    role: 'Heavy-lift multi-purpose hexacopter',
    tagline: 'Built for demanding field operations.',
    image: '/media/fleet/a6-cut.webp',
    alt: 'Skycopter A6 hexacopter carrying a LiDAR payload',
    specs: [
      { label: 'Max payload', value: 'Up to 7 kg' },
      { label: 'Flight time', value: '45 ± 5 min' },
      { label: 'MTOW', value: '19.12 kg' },
      { label: 'Certification', value: 'DGCA Type Certified' },
    ],
    features: ['Modular plug-in payloads, swapped in minutes', 'Carbon-fibre construction', 'Power line stringing & cargo to tower platforms'],
    typeCertified: true,
  },
  {
    id: 'skycopter-x6',
    name: 'Skycopter X6',
    role: 'Compact multi-mission hexacopter',
    tagline: 'Precision for every mission.',
    image: '/media/fleet/x6-cut.webp',
    alt: 'Skycopter X6 compact industrial hexacopter in flight',
    specs: [
      { label: 'Max payload', value: 'Up to 3 kg' },
      { label: 'Flight time', value: '45 ± 5 min' },
      // As published on senseimage.in, the same figure as the A6.
      { label: 'MTOW', value: '19.12 kg' },
      { label: 'Build', value: 'Foldable for transport' },
    ],
    features: ['Plug-and-play payload system', 'Redundant GPS', 'Inspection, mapping & stringing'],
  },
  {
    id: 'falcon-a6',
    name: 'Falcon A6',
    role: 'Industrial heavy-lift hexacopter',
    tagline: 'Engineered for harsh environments.',
    image: '/media/fleet/falcon-cut.webp',
    alt: 'Falcon A6 industrial heavy-lift hexacopter',
    specs: [
      { label: 'Max payload', value: 'Up to 3 kg' },
      { label: 'Flight time', value: '45 ± 5 min' },
      { label: 'MTOW', value: '18 kg' },
      { label: 'Build', value: 'Carbon fibre & aluminium' },
    ],
    features: ['Built for dusty, wet and harsh conditions', 'Manual, semi- and fully autonomous modes', 'Return-to-home, geo-fencing, low-battery protection'],
  },
  {
    id: 'skyhunter-vtol',
    name: 'Skyhunter VTOL',
    role: 'Long-endurance VTOL survey drone',
    tagline: 'Cover more. Fly longer.',
    image: '/media/fleet/skyhunter-cut.webp',
    alt: 'Skyhunter VTOL fixed-wing survey drone',
    specs: [
      { label: 'Max payload', value: 'Up to 1 kg' },
      { label: 'Flight time', value: '150 – 190 min' },
      { label: 'MTOW', value: '7 kg' },
      { label: 'Launch', value: 'Vertical, no runway' },
    ],
    features: ['Orthophoto & 3D mapping bay', 'Take-off and landing in confined spaces', 'Fast-assembly design'],
  },
];

export const payloads = ['LiDAR SI-260X', 'MAP 01', 'Thermal Camera', 'Zoom Camera', 'Oblique Camera'];

export const shift = {
  eyebrow: 'Industrial operations',
  line: ['Not every mission', 'is a battlefield.'],
};

export const caseStudy = {
  client: 'Larsen & Toubro',
  eyebrow: 'Case study // L&T',
  headline: ['1,000+ km of power line.', 'Surveyed from the air.'],
  text: 'How L&T executed 1,000+ km power line projects faster using drone-based inspection.',
  image: { src: '/media/case/powerline-towers.webp', alt: 'Drone inspecting high-voltage power line towers over hilly terrain' },
};

export const industries = {
  intro:
    'We deliver drone intelligence for critical operations across defence, power transmission, mining, oil and gas, and government infrastructure projects.',
  items: [
    {
      title: 'Defence & Security',
      lead: ['Airspace,', 'held.'],
      text: 'Autonomous interception, GPS-denied navigation and EO/IR targeting for border and base security.',
      image: '/media/industries/defence.webp',
      alt: 'Interceptor drone over a Himalayan outpost',
      tags: ['IndraKavach', 'EO/IR', 'Border security'],
    },
    {
      title: 'Energy & Utilities',
      lead: ['Every insulator,', 'every span.'],
      text: 'Thermal and optical inspection of substations, insulators and conductors, plus pilot-line stringing over rough terrain.',
      image: '/media/industries/energy.webp',
      alt: 'Wind turbines and solar arrays at sunset',
      tags: ['Skycopter A6', 'Thermal camera', 'Line stringing'],
    },
    {
      title: 'Mining',
      lead: ['Stockpiles,', 'measured.'],
      text: 'High-density LiDAR point clouds, orthophotos and photogrammetry models for infrastructure design.',
      image: '/media/industries/mining.webp',
      alt: 'Survey drone over an open-pit mine',
      tags: ['LiDAR SI-260X', 'Survey & mapping', 'Stockpiles'],
    },
    {
      title: 'Oil & Gas',
      lead: ['Pipelines,', 'watched.'],
      text: 'Autonomous corridor monitoring along pipelines, railways and rights-of-way, with perimeter watch at facilities.',
      image: '/media/industries/oil-gas.webp',
      alt: 'Drone over an offshore oil platform at sunset',
      tags: ['Corridor surveillance', 'Leak detection', 'Perimeter'],
    },
    {
      title: 'Government & GIS',
      lead: ['Maps that', 'governments use.'],
      text: 'Government GIS mapping, orthophoto and 3D mapping, from VTOL long-range survey to LiDAR.',
      image: '/media/industries/gis.webp',
      alt: 'Earth observation satellite',
      tags: ['Skyhunter VTOL', 'Orthophoto', '3D mapping'],
    },
    {
      title: 'Surveillance',
      lead: ['Eyes over', 'the city.'],
      text: 'Monitoring and detection for smart-city and critical sites, with zoom and thermal payloads.',
      image: '/media/industries/surveillance.webp',
      alt: 'Drone mapping a city with data overlays',
      tags: ['Monitoring & detection', 'Zoom camera', 'Smart city'],
    },
  ],
};

export const demo = {
  eyebrow: 'Field demonstration',
  title: 'See it fly.',
  text: 'Live IndraKavach interception demonstrations for defence evaluators, covering integration scenarios and requirements.',
};

export const fieldDemo = {
  callout: 'Ready to see IndraKavach in action?',
  calloutDim: 'Talk to our defence & industrial team.',
  modes: [
    { id: 'defence', label: 'Defence field demo', subject: 'IndraKavach field demonstration request' },
    { id: 'industrial', label: 'Industrial / GIS consultation', subject: 'Industrial / GIS consultation request' },
  ],
} as const;

export const footer = {
  line: ['Airspace,', 'secured.'],
  tagline: 'Indigenous drone intelligence for defence, infrastructure and government.',
};

export const leadership = [
  { name: 'Bhanu Praveen', role: 'Founder & CEO' },
  { name: 'Jagadesan', role: 'Chief Operating Officer' },
  { name: 'Limton Xavier', role: 'CBO & EVP Sales & SE' },
  { name: 'Aravinth', role: 'Head of Finance & Admin' },
  { name: 'Uikattu Dass', role: 'Head of Services' },
  { name: 'MothiLal', role: 'Director' },
  { name: 'Aadithya Krishnan', role: 'Director of Design' },
  { name: 'Manisha', role: 'Director of Overseas Operation' },
];

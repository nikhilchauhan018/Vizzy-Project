/**
 * Generates rich SVG Data URIs representing graphic novel panels
 * with authentic cinematic grading, inking, grain, and scene composition.
 */

export function createGraphicNovelArt({
  title,
  theme = 'war',
  shotType = 'wide',
  mood = 'tense',
  palette = ['#1A2530', '#3E505B', '#8C9BA5', '#D87A43', '#F2E8DC'],
  character = 'Soldier',
  lighting = 'rim',
  detail = 'normal',
}: {
  title: string;
  theme?: 'war' | 'cyberpunk' | 'noir' | 'scifi' | 'general';
  shotType?: 'wide' | 'medium' | 'close' | 'dutch';
  mood?: string;
  palette?: string[];
  character?: string;
  lighting?: string;
  detail?: string;
}): string {
  const c1 = palette[0] || '#0F172A';
  const c2 = palette[1] || '#1E293B';
  const c3 = palette[2] || '#334155';
  const accent = palette[3] || '#F59E0B';
  const light = palette[4] || '#F8FAFC';

  let subjectSvg = '';

  if (theme === 'war') {
    if (shotType === 'close') {
      subjectSvg = `
        <!-- Extreme Close Up: Battle-tested face with helmet -->
        <ellipse cx="400" cy="230" rx="90" ry="120" fill="${c2}" stroke="#000" stroke-width="6"/>
        <!-- Steel M1 Helmet -->
        <path d="M 270,180 C 280,70 520,70 530,180 C 490,200 310,200 270,180 Z" fill="${c1}" stroke="#000" stroke-width="6"/>
        <path d="M 260,180 Q 400,210 540,180" stroke="${accent}" stroke-width="4" fill="none"/>
        <!-- Eyes & Face Lines -->
        <rect x="340" y="210" width="35" height="10" rx="4" fill="#000"/>
        <circle cx="355" cy="215" r="4" fill="${light}"/>
        <rect x="425" y="210" width="35" height="10" rx="4" fill="#000"/>
        <circle cx="440" cy="215" r="4" fill="${light}"/>
        <path d="M 395,210 L 400,260 L 415,265" stroke="#000" stroke-width="5" fill="none"/>
        <path d="M 370,285 Q 400,280 430,285" stroke="#000" stroke-width="6" fill="none"/>
        <!-- Stubble & Dirt -->
        <path d="M 330,240 Q 380,260 410,240" stroke="${c3}" stroke-width="3" stroke-dasharray="3,3" fill="none"/>
        <!-- Dramatic rim light on jaw -->
        <path d="M 315,220 C 310,290 380,340 400,345" stroke="${accent}" stroke-width="5" fill="none"/>
      `;
    } else if (shotType === 'medium') {
      subjectSvg = `
        <!-- Medium Shot: 2 Rangers navigating beach obstacle -->
        <ellipse cx="360" cy="200" rx="35" ry="40" fill="${c1}" stroke="#000" stroke-width="4"/>
        <path d="M 320,190 C 320,130 400,130 400,190 Z" fill="${c2}" stroke="#000" stroke-width="4"/>
        <path d="M 310,230 L 410,230 L 430,380 L 290,380 Z" fill="${c1}" stroke="#000" stroke-width="5"/>
        <!-- Webbing & Rifle -->
        <line x1="330" y1="230" x2="390" y2="340" stroke="${c3}" stroke-width="6"/>
        <line x1="390" y1="230" x2="330" y2="340" stroke="${c3}" stroke-width="6"/>
        <rect x="310" y="270" width="160" height="16" rx="4" transform="rotate(-20 310 270)" fill="#0A0A0A"/>
        <!-- Second soldier in background -->
        <ellipse cx="490" cy="230" rx="25" ry="30" fill="${c2}" opacity="0.8"/>
        <path d="M 450,250 L 530,250 L 540,360 L 440,360 Z" fill="${c2}" opacity="0.8"/>
      `;
    } else {
      subjectSvg = `
        <!-- Wide Establishing: Czech hedgehogs, smoking landing craft, storming soldiers -->
        <!-- Smoking Higgins Boat -->
        <polygon points="120,290 190,260 280,270 240,330 110,320" fill="${c1}" stroke="#000" stroke-width="3"/>
        <path d="M 170,250 Q 150,160 190,100 Q 220,160 180,240" fill="${c3}" opacity="0.4"/>
        <!-- Steel Hedgehogs -->
        <line x1="430" y1="310" x2="490" y2="390" stroke="#000" stroke-width="9"/>
        <line x1="490" y1="310" x2="430" y2="390" stroke="#000" stroke-width="9"/>
        <line x1="420" y1="350" x2="500" y2="350" stroke="#000" stroke-width="9"/>
        <!-- Advancing Soldier Silhouettes -->
        <circle cx="340" cy="330" r="10" fill="#000"/>
        <polygon points="335,340 345,340 350,390 330,390" fill="#000"/>
        <line x1="340" y1="350" x2="370" y2="335" stroke="#000" stroke-width="4"/>

        <circle cx="390" cy="340" r="9" fill="#000"/>
        <polygon points="385,348 395,348 400,395 380,395" fill="#000"/>
      `;
    }
  } else {
    // Cyberpunk / Noir
    subjectSvg = `
      <!-- Cyberpunk / Noir Silhouette with Glowing Accents -->
      <ellipse cx="400" cy="180" rx="35" ry="45" fill="${c1}" stroke="#000" stroke-width="4"/>
      <!-- Glowing ocular cybernetic eye -->
      <circle cx="410" cy="175" r="5" fill="${accent}"/>
      <circle cx="410" cy="175" r="10" fill="${accent}" opacity="0.4"/>
      <!-- Trenchcoat silhouette -->
      <path d="M 330,220 L 470,220 L 510,400 L 290,400 Z" fill="${c1}" stroke="#000" stroke-width="5"/>
      <!-- Neon rim on shoulders -->
      <path d="M 330,225 L 360,350" stroke="${accent}" stroke-width="4" fill="none"/>
      <path d="M 470,225 L 440,350" stroke="${c3}" stroke-width="4" fill="none"/>
    `;
  }

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="60%" stop-color="${c2}" />
          <stop offset="100%" stop-color="${c3}" />
        </linearGradient>
        <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${c2}" />
          <stop offset="100%" stop-color="#05070B" />
        </linearGradient>
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.12 0" />
        </filter>
      </defs>

      <!-- Background Sky -->
      <rect width="800" height="450" fill="url(#skyGrad)" />

      <!-- Atmospheric clouds / smoke -->
      <path d="M -50,180 Q 200,90 450,160 T 850,120 L 850,280 L -50,280 Z" fill="${c3}" opacity="0.35" />
      <path d="M -50,220 Q 300,160 550,210 T 850,190 L 850,320 L -50,320 Z" fill="${c2}" opacity="0.45" />

      <!-- Bluffs / Horizon -->
      <polygon points="-10,260 180,240 390,255 580,235 810,250 810,310 -10,310" fill="${c1}" opacity="0.9" />

      <!-- Sea / Sand / Ground -->
      <rect y="290" width="800" height="160" fill="url(#groundGrad)" />
      
      <!-- Churning water foam or light reflections -->
      <path d="M 0,305 Q 200,315 400,305 T 800,310" stroke="${accent}" stroke-width="2" opacity="0.6" fill="none"/>
      <path d="M 0,335 Q 250,345 500,335 T 800,340" stroke="${c3}" stroke-width="2" opacity="0.4" fill="none"/>

      <!-- Subject & Characters -->
      ${subjectSvg}

      <!-- Atmospheric Weather / Rain / Dust Streaks -->
      <g stroke="${light}" stroke-width="1" opacity="0.18">
        <line x1="80" y1="0" x2="50" y2="120" />
        <line x1="220" y1="40" x2="190" y2="190" />
        <line x1="390" y1="10" x2="360" y2="170" />
        <line x1="560" y1="80" x2="530" y2="240" />
        <line x1="710" y1="20" x2="680" y2="180" />
      </g>

      <!-- Film Grain Overlay -->
      <rect width="800" height="450" filter="url(#noiseFilter)" opacity="0.4" pointer-events="none" />

      <!-- Graphic Novel Vignette & Inked Outer Border -->
      <rect x="0" y="0" width="800" height="450" fill="none" stroke="#05070B" stroke-width="8"/>
      
      <!-- Watermark Badge -->
      <rect x="18" y="18" width="90" height="22" rx="4" fill="#000000" opacity="0.75"/>
      <text x="63" y="33" font-family="sans-serif" font-size="10" font-weight="bold" fill="${accent}" text-anchor="middle" letter-spacing="1">VIZZY V2</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

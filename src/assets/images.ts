export function avatarSvg(name: string, bgColor: string, features: string = ''): string {
  const initial = name[0].toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${bgColor}"/>
        <stop offset="100%" style="stop-color:#6366F1"/>
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="100" fill="url(#bg)"/>
    ${features}
    <text x="100" y="115" font-family="Space Grotesk,sans-serif" font-size="64" font-weight="700" fill="white" text-anchor="middle">${initial}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const avatarNadia = avatarSvg('N', '#7C3AED',
  `<ellipse cx="100" cy="55" rx="35" ry="38" fill="#EDE9FE" opacity="0.3"/>
   <path d="M55 70 Q60 30 100 25 Q140 30 145 70 Q145 55 100 50 Q55 55 55 70Z" fill="rgba(255,255,255,0.15)"/>`)

export const avatarKarim = avatarSvg('K', '#EA580C',
  `<rect x="65" y="10" width="70" height="25" rx="12" fill="#FACC15" opacity="0.6"/>`)

export const avatarYacine = avatarSvg('Y', '#2563EB',
  `<rect x="75" y="140" width="50" height="8" rx="4" fill="rgba(255,255,255,0.3)"/>`)

export function photoPlaceholder(label: string, color1: string, color2: string, icon: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="pbg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1}"/>
        <stop offset="100%" style="stop-color:${color2}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#pbg)"/>
    <text x="200" y="140" font-size="48" text-anchor="middle" fill="white" opacity="0.4">${icon}</text>
    <text x="200" y="190" font-family="Space Grotesk,sans-serif" font-size="14" font-weight="600" fill="white" opacity="0.7" text-anchor="middle">${label}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const photos = {
  fibreAvant: photoPlaceholder('Câblage cuivre — Avant', '#78350F', '#92400E', '🔌'),
  fibreApres: photoPlaceholder('Fibre FTTH installée — Après', '#065F46', '#047857', '✅'),
  armoireAvant: photoPlaceholder('Armoire technique — Avant', '#7C2D12', '#9A3412', '⚡'),
  armoireApres: photoPlaceholder('Armoire réorganisée — Après', '#14532D', '#166534', '✅'),
  commerceAvant: photoPlaceholder('Commerce — Avant', '#44403C', '#57534E', '🏪'),
  commerceApres: photoPlaceholder('Commerce fibré — Après', '#1E3A5F', '#1E40AF', '✅'),
  modemAvant: photoPlaceholder('Modem ADSL HS — Avant', '#7F1D1D', '#991B1B', '🔴'),
  modemApres: photoPlaceholder('Modem fibre OK — Après', '#14532D', '#15803D', '🟢'),
}

export function logoSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#7C3AED"/>
        <stop offset="100%" style="stop-color:#6366F1"/>
      </linearGradient>
    </defs>
    <polygon points="256,30 462,148 462,364 256,482 50,364 50,148" fill="url(#lg)" rx="20"/>
    <g transform="translate(256,220)" fill="white" opacity="0.95">
      <circle cx="0" cy="-50" r="28" fill="none" stroke="white" stroke-width="4"/>
      <line x1="0" y1="-22" x2="0" y2="30" stroke="white" stroke-width="5" stroke-linecap="round"/>
      <line x1="-30" y1="-5" x2="0" y2="10" stroke="white" stroke-width="4" stroke-linecap="round"/>
      <line x1="30" y1="-5" x2="0" y2="10" stroke="white" stroke-width="4" stroke-linecap="round"/>
      <line x1="-15" y1="30" x2="0" y2="60" stroke="white" stroke-width="4" stroke-linecap="round"/>
      <line x1="15" y1="30" x2="0" y2="60" stroke="white" stroke-width="4" stroke-linecap="round"/>
      <path d="M32,-15 L50,-30 L55,-10 Z" fill="white" opacity="0.8"/>
      <line x1="35" y1="-20" x2="55" y2="-20" stroke="white" stroke-width="3"/>
    </g>
    <text x="256" y="460" font-family="Space Grotesk,sans-serif" font-size="52" font-weight="700" fill="white" text-anchor="middle">FANNI Pro</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function heroSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">
    <rect width="1200" height="400" fill="#0F0720"/>
    <g opacity="0.15">
      <line x1="100" y1="200" x2="400" y2="100" stroke="#7C3AED" stroke-width="2"/>
      <line x1="400" y1="100" x2="700" y2="180" stroke="#7C3AED" stroke-width="2"/>
      <line x1="700" y1="180" x2="1000" y2="80" stroke="#6366F1" stroke-width="2"/>
      <line x1="1000" y1="80" x2="1100" y2="200" stroke="#6366F1" stroke-width="2"/>
      <line x1="400" y1="100" x2="500" y2="300" stroke="#7C3AED" stroke-width="1.5"/>
      <line x1="700" y1="180" x2="600" y2="350" stroke="#6366F1" stroke-width="1.5"/>
      <line x1="700" y1="180" x2="900" y2="320" stroke="#7C3AED" stroke-width="1.5"/>
      <line x1="200" y1="300" x2="400" y2="100" stroke="#6366F1" stroke-width="1"/>
      <line x1="1000" y1="80" x2="1050" y2="300" stroke="#7C3AED" stroke-width="1"/>
    </g>
    <g opacity="0.4">
      <circle cx="100" cy="200" r="5" fill="#7C3AED"/><circle cx="100" cy="200" r="10" fill="none" stroke="#7C3AED" stroke-width="1" opacity="0.3"/>
      <circle cx="400" cy="100" r="6" fill="#7C3AED"/><circle cx="400" cy="100" r="12" fill="none" stroke="#7C3AED" stroke-width="1" opacity="0.3"/>
      <circle cx="700" cy="180" r="7" fill="#6366F1"/><circle cx="700" cy="180" r="14" fill="none" stroke="#6366F1" stroke-width="1" opacity="0.3"/>
      <circle cx="1000" cy="80" r="5" fill="#6366F1"/><circle cx="1000" cy="80" r="10" fill="none" stroke="#6366F1" stroke-width="1" opacity="0.3"/>
      <circle cx="1100" cy="200" r="4" fill="#7C3AED"/>
      <circle cx="500" cy="300" r="4" fill="#7C3AED"/>
      <circle cx="600" cy="350" r="3" fill="#6366F1"/>
      <circle cx="900" cy="320" r="4" fill="#7C3AED"/>
      <circle cx="200" cy="300" r="3" fill="#6366F1"/>
      <circle cx="1050" cy="300" r="3" fill="#7C3AED"/>
    </g>
    <g opacity="0.08">
      <rect x="50" y="250" width="30" height="100" rx="3" fill="#7C3AED"/>
      <rect x="55" y="220" width="20" height="30" fill="none" stroke="#7C3AED" stroke-width="1"/>
      <line x1="65" y1="190" x2="65" y2="220" stroke="#7C3AED" stroke-width="2"/>
      <line x1="55" y1="200" x2="75" y2="200" stroke="#7C3AED" stroke-width="1"/>
      <rect x="1100" y="150" width="50" height="120" rx="4" fill="#6366F1"/>
      <rect x="1105" y="155" width="10" height="6" rx="1" fill="white" opacity="0.3"/>
      <rect x="1105" y="165" width="10" height="6" rx="1" fill="white" opacity="0.3"/>
      <rect x="1120" y="155" width="10" height="6" rx="1" fill="white" opacity="0.3"/>
    </g>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

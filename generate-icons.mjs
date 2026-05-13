#!/usr/bin/env node
/**
 * Génère des icônes SVG simples pour la PWA.
 * Lancez : node generate-icons.mjs
 * Ensuite convertissez les SVG en PNG avec Inkscape, ImageMagick ou un outil en ligne.
 */

import { writeFileSync, mkdirSync } from 'fs'

const sizes = [192, 512]

const svgIcon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#07090F"/>
  <rect width="100" height="100" rx="22" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00D68F;stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:#4D9FFF;stop-opacity:0.3"/>
    </linearGradient>
  </defs>
  <text x="50" y="62" font-size="50" text-anchor="middle" font-family="sans-serif">🏃</text>
</svg>`

mkdirSync('public/icons', { recursive: true })

sizes.forEach((size) => {
  writeFileSync(`public/icons/icon-${size}.svg`, svgIcon(size))
  console.log(`✓ public/icons/icon-${size}.svg généré`)
})

console.log('\n⚠️  Convertissez les SVG en PNG pour la PWA :')
console.log('  Option 1 : https://svgtopng.com')
console.log('  Option 2 : npx sharp-cli --input public/icons/icon-192.svg --output public/icons/icon-192.png')

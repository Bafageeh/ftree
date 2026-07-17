#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outputDir = path.resolve(process.argv[2] || path.join(process.cwd(), 'assets'));
fs.mkdirSync(outputDir, { recursive: true });

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#173F2B"/>
      <stop offset="0.55" stop-color="#0E3424"/>
      <stop offset="1" stop-color="#08291C"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFF0A8"/>
      <stop offset="0.28" stop-color="#D8A936"/>
      <stop offset="0.58" stop-color="#FFF3B5"/>
      <stop offset="1" stop-color="#A56F16"/>
    </linearGradient>
    <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#B4B66A"/>
      <stop offset="1" stop-color="#526A32"/>
    </linearGradient>
    <radialGradient id="ivory" cx="35%" cy="25%" r="80%">
      <stop offset="0" stop-color="#FFFDF2"/>
      <stop offset="1" stop-color="#E9DFC1"/>
    </radialGradient>
    <filter id="shadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="14" stdDeviation="13" flood-color="#000000" flood-opacity="0.42"/>
    </filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#000000" flood-opacity="0.28"/>
    </filter>
  </defs>

  <rect width="1024" height="1024" rx="205" fill="url(#bg)"/>
  <rect x="34" y="34" width="956" height="956" rx="178" fill="none" stroke="url(#gold)" stroke-width="30"/>
  <rect x="66" y="66" width="892" height="892" rx="150" fill="none" stroke="#6C7E43" stroke-width="5" opacity="0.75"/>

  <path d="M185 650V405C185 333 231 282 291 277C304 218 353 182 414 190C442 148 475 113 512 72C549 113 582 148 610 190C671 182 720 218 733 277C793 282 839 333 839 405V650" fill="none" stroke="#5B713B" stroke-width="12" opacity="0.55"/>

  <g filter="url(#shadow)" stroke="url(#gold)" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M512 866C486 787 471 710 512 625" stroke-width="36"/>
    <path d="M512 866C430 793 383 727 332 650C294 595 265 566 222 553" stroke-width="30"/>
    <path d="M512 866C594 793 641 727 692 650C730 595 759 566 802 553" stroke-width="30"/>
    <path d="M512 625V265" stroke-width="24"/>
    <path d="M512 500C450 438 400 389 333 382" stroke-width="22"/>
    <path d="M512 500C574 438 624 389 691 382" stroke-width="22"/>
  </g>

  <g fill="url(#leaf)" stroke="#D6C46D" stroke-width="4" filter="url(#soft)">
    <path d="M301 735C248 690 215 702 203 755C248 770 278 763 301 735Z"/>
    <path d="M350 790C293 762 266 783 270 837C316 839 342 823 350 790Z"/>
    <path d="M409 817C362 785 331 799 323 850C370 861 399 850 409 817Z"/>
    <path d="M723 735C776 690 809 702 821 755C776 770 746 763 723 735Z"/>
    <path d="M674 790C731 762 758 783 754 837C708 839 682 823 674 790Z"/>
    <path d="M615 817C662 785 693 799 701 850C654 861 625 850 615 817Z"/>
    <path d="M300 531C257 493 229 503 220 548C257 557 282 551 300 531Z"/>
    <path d="M724 531C767 493 795 503 804 548C767 557 742 551 724 531Z"/>
    <path d="M412 291C374 252 347 261 342 305C379 315 400 309 412 291Z"/>
    <path d="M612 291C650 252 677 261 682 305C645 315 624 309 612 291Z"/>
  </g>

  <g fill="none" stroke="#314B28" stroke-width="4" opacity="0.55">
    <path d="M210 749L286 724"/><path d="M279 830L343 793"/><path d="M331 846L401 817"/>
    <path d="M814 749L738 724"/><path d="M745 830L681 793"/><path d="M693 846L623 817"/>
    <path d="M227 544L290 523"/><path d="M797 544L734 523"/>
    <path d="M349 301L405 286"/><path d="M675 301L619 286"/>
  </g>

  <g filter="url(#shadow)">
    ${[
      [512,232,91],[333,382,85],[691,382,85],[512,535,111],[222,553,78],[802,553,78]
    ].map(([cx,cy,r]) => `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#ivory)" stroke="url(#gold)" stroke-width="16"/>
      <circle cx="${cx}" cy="${cy-r*0.18}" r="${r*0.22}" fill="#C8922B"/>
      <path d="M${cx-r*0.32} ${cy+r*0.34} Q${cx} ${cy+r*0.03} ${cx+r*0.32} ${cy+r*0.34} L${cx+r*0.32} ${cy+r*0.48} L${cx-r*0.32} ${cy+r*0.48}Z" fill="#C8922B"/>
    `).join('')}
  </g>

  <path d="M210 899C332 915 411 910 512 867C613 910 692 915 814 899" fill="none" stroke="#B8862B" stroke-width="9" opacity="0.55"/>
</svg>`;

async function render() {
  const icon = sharp(Buffer.from(svg));
  await icon.png().toFile(path.join(outputDir, 'icon.png'));
  await icon.png().toFile(path.join(outputDir, 'adaptive-icon.png'));
  await icon.resize(640, 640).extend({
    top: 192,
    bottom: 192,
    left: 192,
    right: 192,
    background: '#F5F1E7',
  }).png().toFile(path.join(outputDir, 'splash-icon.png'));
  await sharp(Buffer.from(svg)).resize(128, 128).png().toFile(path.join(outputDir, 'favicon.png'));
  console.log(`Generated official Shajara icon assets in ${outputDir}`);
}

render().catch((error) => {
  console.error(error);
  process.exit(1);
});

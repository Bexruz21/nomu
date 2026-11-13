import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Deterministic export of the existing brand assets; originals remain untouched.
await fs.mkdir('assets/images', { recursive: true });
const files = ['logo.png', 'flag.png', ...Array.from({length: 11}, (_, i) => `clients/brand-${i + 1}.png`),
  'team/team-1.png', 'team/team-2.jpg', 'team/team-3.png', 'team/team-4.jpg', 'team/team-5.jpg', 'team/team-6.PNG'];
const manifest = {};
for (const file of files) {
  const input = path.join('images', file);
  const output = `assets/images/${file.replace(/\.[^.]+$/, '.webp')}`;
  await fs.mkdir(path.dirname(output), { recursive: true });
  const maxWidth = file.startsWith('clients/') ? 400 : file.startsWith('team/') ? 640 : file === 'flag.png' ? 800 : 1133;
  await sharp(input).resize({width: maxWidth, withoutEnlargement: true}).webp({quality: 86, effort: 6}).toFile(output);
  const info = await sharp(output).metadata();
  manifest[file] = {src: `/${output}`, width: info.width, height: info.height};
}
await fs.writeFile('assets/images/manifest.json', JSON.stringify(manifest, null, 2) + '\n');

// The favicon uses the existing logo's first letter, which stays legible at 16px.
const mark = await sharp('images/logo.png').extract({left: 0, top: 0, width: 228, height: 228}).png().toBuffer();
const icon = await sharp({create: {width: 512, height: 512, channels: 4, background: '#050d0a'}})
  .composite([{input: await sharp(mark).resize(352,352).png().toBuffer(),left:80,top:80}]).png().toBuffer();
for (const size of [32, 48, 96, 180, 192, 512]) {
  await sharp(icon).resize(size,size).png().toFile(size === 180 ? 'apple-touch-icon.png' : `favicon-${size}.png`);
}
// ICO container with PNG frames, supported by current browsers and Windows.
const frames = await Promise.all([16,32,48].map(size => sharp(icon).resize(size,size).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(1,2); header.writeUInt16LE(frames.length,4);
let offset = header.length;
for (let i=0;i<frames.length;i++) {
  const entry = 6 + 16*i; header[entry]=header[entry+1]=[16,32,48][i];
  header.writeUInt16LE(1,entry+4); header.writeUInt16LE(32,entry+6);
  header.writeUInt32LE(frames[i].length,entry+8); header.writeUInt32LE(offset,entry+12);
  offset += frames[i].length;
}
await fs.writeFile('favicon.ico', Buffer.concat([header,...frames]));
const logo = await sharp('images/logo.png').resize({width:920}).png().toBuffer();
const logoInfo = await sharp(logo).metadata();
await sharp({create:{width:1200,height:630,channels:4,background:'#050d0a'}})
  .composite([{input:logo,left:140,top:Math.round((630-logoInfo.height)/2)}])
  .png().toFile('assets/nomu-social.png');
await fs.writeFile('site.webmanifest', JSON.stringify({name:'NOMU Marketing Agency',short_name:'NOMU',start_url:'/',display:'browser',background_color:'#050d0a',theme_color:'#050d0a',icons:[192,512].map(size=>({src:`/favicon-${size}.png`,sizes:`${size}x${size}`,type:'image/png'}))},null,2)+'\n');
console.log('Optimized 19 images; exported branded favicons and sharing image.');

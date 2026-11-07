import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/home/z/my-project/public/products';

const PRODUCTS = [
  { file: 'roses-pink.jpg', prompt: 'Professional product photography of a luxurious bouquet of pink roses wrapped in cream paper with satin ribbon, soft warm studio lighting, cream background, flower shop style, high quality, detailed' },
  { file: 'tulips-bouquet.jpg', prompt: 'Professional product photography of a fresh bouquet of colorful tulips in pastel pink and yellow, kraft paper wrapping, soft natural light, cream background, high quality' },
  { file: 'lilies-white.jpg', prompt: 'Professional product photography of an elegant white lilies bouquet with green eucalyptus leaves, white wrapping, bright airy studio, soft shadows, high quality' },
  { file: 'mixed-spring.jpg', prompt: 'Professional product photography of a vibrant spring flower bouquet with gerbera daisies, carnations and baby breath in pink purple and white tones, gift ribbon, cream studio background, high quality' },
  { file: 'box-love.jpg', prompt: 'Professional product photography of a round pink flower box filled with fresh red and pink roses, luxury gift box arrangement, soft studio lighting, cream background, high quality' },
  { file: 'box-luxury.jpg', prompt: 'Professional product photography of a luxury square black flower box with red roses and gold accents, premium gift arrangement, dramatic soft lighting, cream background, high quality' },
  { file: 'orchid-vase.jpg', prompt: 'Professional product photography of a white phalaenopsis orchid plant in an elegant ceramic pot, minimalist style, bright studio with cream background, high quality, detailed' },
  { file: 'succulent-garden.jpg', prompt: 'Professional product photography of a decorative succulent garden arrangement in a wooden box, small cactus and echeveria plants, natural style, cream background, soft light, high quality' },
  { file: 'wreath-condolence.jpg', prompt: 'Professional product photography of an elegant white funeral wreath with white lilies, roses and green foliage, respectful arrangement, soft neutral background, high quality' },
  { file: 'wreath-welcome.jpg', prompt: 'Professional product photography of a decorative welcome wreath with dried flowers, pampas grass and eucalyptus on a round wooden hoop, warm beige tones, cream background, high quality' },
  { file: 'dried-bouquet.jpg', prompt: 'Professional product photography of a dried flowers bouquet with pampas grass, bunny tails and dried roses in beige and dusty pink tones, kraft paper, boho style, cream background, high quality' },
  { file: 'sunflower-bouquet.jpg', prompt: 'Professional product photography of a cheerful sunflower bouquet wrapped in burlap and kraft paper, bright warm lighting, cream background, flower shop style, high quality' },
];

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const zai = await ZAI.create();
  const results = [];
  for (const p of PRODUCTS) {
    const outPath = path.join(OUTPUT_DIR, p.file);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 50000) {
      console.log(`skip (exists): ${p.file}`);
      results.push({ file: p.file, ok: true, skipped: true });
      continue;
    }
    let ok = false;
    for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
      try {
        const res = await zai.images.generations.create({ prompt: p.prompt, size: '1024x1024' });
        const b64 = res.data?.[0]?.base64;
        if (!b64) throw new Error('no image data');
        fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
        console.log(`ok: ${p.file}`);
        ok = true;
      } catch (e) {
        console.error(`attempt ${attempt} failed for ${p.file}: ${e.message}`);
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    results.push({ file: p.file, ok });
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`DONE ok=${results.length - failed.length} failed=${failed.length}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});

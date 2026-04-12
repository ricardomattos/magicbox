// Generates PWA + apple-touch-icon PNGs from public/icon.svg
// Run inside the frontend container:
//   npm install sharp --no-save && node scripts/gen-icons.mjs
import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(__dirname, "../public/icon.svg"));
const out = (f) => join(__dirname, "../public", f);

await sharp(svg).resize(512).png().toFile(out("pwa-512x512.png"));
await sharp(svg).resize(192).png().toFile(out("pwa-192x192.png"));
await sharp(svg).resize(180).png().toFile(out("apple-touch-icon.png"));

console.log("✓ pwa-512x512.png");
console.log("✓ pwa-192x192.png");
console.log("✓ apple-touch-icon.png");

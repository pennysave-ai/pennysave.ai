import sharp from "sharp";

const input = "src/app/public/dashboard.png"; // Use the original high-res image

// Generate optimized versions with better quality for text readability
const sizes = [
  { width: 768, name: "mobile" }, // Increased from 640
  { width: 1024, name: "tablet" }, // Increased from 900
  { width: 1536, name: "desktop" }, // Increased from 1280
];

for (const { width, name } of sizes) {
  // WebP with higher quality
  await sharp(input)
    .resize(width, null, {
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3, // Better quality resampling
    })
    .sharpen() // Add sharpening for text clarity
    .webp({ quality: 100, effort: 6 }) // Increased from 75
    .toFile(`src/app/public/dashboard_${name}.webp`);

  // AVIF with higher quality
  await sharp(input)
    .resize(width, null, {
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen()
    .avif({ quality: 100, effort: 6 }) // Increased from 65
    .toFile(`src/app/public/dashboard_${name}.avif`);

  console.log(`✓ Generated ${name} (${width}w)`);
}

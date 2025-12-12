import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export async function getStaticPaths() {
  const outputDir = path.join(process.cwd(), 'src/pages/output_2');
  const paths = [];

  if (fs.existsSync(outputDir)) {
    const docs = fs.readdirSync(outputDir);
    for (const docId of docs) {
      const imagesDir = path.join(outputDir, docId, 'images');
      if (fs.existsSync(imagesDir) && fs.statSync(imagesDir).isDirectory()) {
        const images = fs.readdirSync(imagesDir);
        for (const image of images) {
            if (image.startsWith('.')) continue; // Ignore .DS_Store etc
            paths.push({
                params: { docId, filename: image },
                props: { filePath: path.join(imagesDir, image) }
            });
        }
      }
    }
  }
  return paths;
}

export const GET: APIRoute = async ({ props }) => {
  const { filePath } = props;
  
  try {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.gif') contentType = 'image/gif';
    if (ext === '.webp') contentType = 'image/webp';
    if (ext === '.svg') contentType = 'image/svg+xml';
    
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType
      }
    });
  } catch (e) {
    return new Response('Image not found', { status: 404 });
  }
}

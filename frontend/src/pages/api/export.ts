import type { APIRoute } from "astro";
import fs from "node:fs";
import path from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

// Désactiver le prerender pour cette route API
export const prerender = false;

// Fonction pour lire et fusionner les fichiers markdown d'un document
async function getDocumentContent(
  docId: string
): Promise<{ html: string; markdown: string; title: string }> {
  const docPath = path.join(process.cwd(), "src/pages/output_2", docId);

  if (!fs.existsSync(docPath)) {
    throw new Error("Document not found");
  }

  // Lire tous les fichiers page_*.md
  const files = fs
    .readdirSync(docPath)
    .filter((f) => f.startsWith("page_") && f.endsWith(".md"))
    .sort((a, b) => {
      const numA = parseInt(a.match(/page_(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/page_(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  let markdown = "";
  let title = docId;

  for (const file of files) {
    const content = fs.readFileSync(path.join(docPath, file), "utf-8");
    const parts = content.split("---");

    if (parts.length >= 3) {
      // Extraire le frontmatter pour le titre
      const frontmatter = parts[1];
      const titleMatch = frontmatter.match(/document_title:\s*(.+)/);
      if (titleMatch && title === docId) {
        title = titleMatch[1].trim().replace(/^["']|["']$/g, "");
      }

      const body = parts.slice(2).join("---").trim();
      markdown += (markdown ? "\n\n" : "") + body;
    } else {
      markdown += (markdown ? "\n\n" : "") + content;
    }
  }

  // Remplacer les chemins d'images
  markdown = markdown.replace(/\]\(images\//g, `](/images/${docId}/`);

  // Convertir en HTML
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const file = await processor.process(markdown);
  const html = String(file);

  return { html, markdown, title };
}

// Générer le HTML complet avec styles
function generateFullHtml(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg-color: #ffffff;
      --text-color: #1a1a1a;
      --accent-color: #2563eb;
    }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.8;
      color: var(--text-color);
      background: var(--bg-color);
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      margin-top: 2rem;
      margin-bottom: 1rem;
      line-height: 1.3;
    }
    h1 { font-size: 2rem; border-bottom: 2px solid var(--accent-color); padding-bottom: 0.5rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    p { margin-bottom: 1rem; text-align: justify; }
    img { max-width: 100%; height: auto; margin: 1rem 0; }
    blockquote {
      border-left: 4px solid var(--accent-color);
      margin: 1rem 0;
      padding-left: 1rem;
      font-style: italic;
      color: #555;
    }
    code {
      background: #f4f4f4;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre {
      background: #f4f4f4;
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.75rem;
      text-align: left;
    }
    th { background: #f9f9f9; }
    a { color: var(--accent-color); }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${content}
</body>
</html>`;
}

export const GET: APIRoute = async ({ request, url }) => {
  // Essayer d'abord avec url (fourni par Astro), sinon parser request.url
  let docId: string | null = null;
  let format: string = "html";
  
  // Méthode 1: utiliser url fourni par Astro
  if (url && url.searchParams) {
    docId = url.searchParams.get("docId");
    format = url.searchParams.get("format") || "html";
  }
  
  // Méthode 2: parser manuellement si la méthode 1 échoue
  if (!docId && request.url) {
    const urlString = request.url;
    const queryStart = urlString.indexOf("?");
    if (queryStart !== -1) {
      const queryString = urlString.substring(queryStart + 1);
      const params = new URLSearchParams(queryString);
      docId = params.get("docId");
      format = params.get("format") || "html";
    }
  }
  
  console.log("Export API - request.url:", request.url);
  console.log("Export API - parsed params:", { docId, format });

  if (!docId) {
    return new Response(JSON.stringify({ error: "Missing docId parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { html, markdown, title } = await getDocumentContent(docId);

    if (format === "html") {
      const fullHtml = generateFullHtml(html, title);
      return new Response(fullHtml, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${docId}.html"`,
        },
      });
    }

    if (format === "md") {
      return new Response(markdown, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${docId}.md"`,
        },
      });
    }

    if (format === "epub") {
      // Générer un EPUB simplifié
      const { default: epub } = await import("epub-gen-memory");

      const epubBuffer = await epub({
        title: title,
        author: "Document exporté",
        content: [
          {
            title: title,
            data: html,
          },
        ],
      });

      return new Response(epubBuffer, {
        headers: {
          "Content-Type": "application/epub+zip",
          "Content-Disposition": `attachment; filename="${docId}.epub"`,
        },
      });
    }

    // Format non supporté
    return new Response(
      JSON.stringify({ error: "Unsupported format. Use: html, md, epub" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Export failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

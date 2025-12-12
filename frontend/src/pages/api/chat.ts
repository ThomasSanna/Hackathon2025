import type { APIRoute } from "astro";
import { Mistral } from "@mistralai/mistralai";
import fs from "node:fs";
import path from "node:path";

// Désactiver le prerender pour cette route API
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { docId, message, history = [] } = body;

    if (!docId || !message) {
      return new Response(
        JSON.stringify({ error: "docId et message sont requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Trouver le fichier PDF source
    const sourceDir = path.join(
      process.cwd(),
      "src/pages/output_2",
      docId,
      "source"
    );

    let pdfPath: string | null = null;

    if (fs.existsSync(sourceDir)) {
      const files = fs.readdirSync(sourceDir);
      const pdfFile = files.find((f) => f.endsWith(".pdf"));
      if (pdfFile) {
        pdfPath = path.join(sourceDir, pdfFile);
      }
    }

    if (!pdfPath || !fs.existsSync(pdfPath)) {
      return new Response(
        JSON.stringify({ error: "Fichier PDF source non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Encoder le PDF en base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64Pdf = pdfBuffer.toString("base64");

    // Initialiser le client Mistral
    const apiKey = import.meta.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Clé API Mistral non configurée" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const client = new Mistral({ apiKey });

    // Construire les messages avec l'historique
    const messages: any[] = [
      {
        role: "system",
        content:
          "Tu es un assistant qui aide les utilisateurs à comprendre et analyser des documents. Réponds de manière claire et concise en français. Base tes réponses uniquement sur le contenu du document fourni.",
      },
    ];

    // Ajouter l'historique des messages
    history.forEach((msg: { role: string; content: string }) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Ajouter le nouveau message avec le document
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: message,
        },
        {
          type: "document_url",
          documentUrl: `data:application/pdf;base64,${base64Pdf}`,
        },
      ],
    });

    // Appeler l'API Mistral
    const chatResponse = await client.chat.complete({
      model: "mistral-small-latest",
      messages,
    });

    const assistantMessage =
      chatResponse.choices?.[0]?.message?.content || "Pas de réponse";

    return new Response(
      JSON.stringify({
        response: assistantMessage,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur API Chat:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur lors de la communication avec l'API",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

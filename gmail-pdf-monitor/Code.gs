/**
 * Gmail PDF Monitor — AbdelBuilder (version Gemini gratuite)
 * Surveille les PDF reçus par mail, extrait les infos via IA,
 * et les envoie à une API.
 *
 * Installation :
 * 1. Va sur https://script.google.com → Nouveau projet
 * 2. Colle ce code
 * 3. Va sur https://aistudio.google.com/app/apikey → crée une clé API (gratuite)
 * 4. Configure GEMINI_API_KEY et API_ENDPOINT ci-dessous
 * 5. Déclencheur (horloge) : processPDFs toutes les 10 min
 */

const CONFIG = {
  API_ENDPOINT: 'https://ton-api.com/webhook',
  API_KEY: '',
  GEMINI_API_KEY: 'ta-cle-gemini-ici',
  SEARCH_QUERY: 'has:attachment filename:pdf is:unread',
  LABEL_PROCESSED: 'PDF_Processed',
};

function processPDFs() {
  const threads = GmailApp.search(CONFIG.SEARCH_QUERY);
  if (threads.length === 0) return;

  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const message of messages) {
      if (message.isUnread()) {
        const pdfs = message.getAttachments().filter(a => a.getContentType().includes('pdf'));
        for (const pdf of pdfs) {
          try {
            const extracted = extractPDFData(pdf);
            if (extracted) sendToAPI(extracted, pdf.getName());
          } catch (e) {
            console.error(`Erreur ${pdf.getName()} : ${e}`);
          }
        }
      }
    }
    thread.addLabel(getOrCreateLabel(CONFIG.LABEL_PROCESSED));
  }
}

function extractPDFData(pdfAttachment) {
  const base64 = Utilities.base64Encode(pdfAttachment.getBytes());

  const prompt = `Tu reçois un PDF (facture, devis, bon de commande).
Extrais toutes les informations importantes.
Réponds UNIQUEMENT en JSON valide, sans texte avant/après.
Exemple de format:
{
  "fournisseur": "...",
  "client": "...",
  "date": "...",
  "numero": "...",
  "montant_ht": "...",
  "tva": "...",
  "montant_ttc": "...",
  "description": "..."
}
Adapte les champs selon le contenu du PDF.`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'application/pdf', data: base64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2000,
    },
  };

  const res = UrlFetchApp.fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
    {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    }
  );

  const json = JSON.parse(res.getContentText());
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const errMsg = json?.error?.message || 'Réponse Gemini vide';
    throw new Error(errMsg);
  }

  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

function sendToAPI(data, filename) {
  const payload = {
    source: 'gmail-pdf-monitor',
    filename: filename,
    extracted_at: new Date().toISOString(),
    data: data,
  };
  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };
  if (CONFIG.API_KEY) {
    options.headers = { Authorization: `Bearer ${CONFIG.API_KEY}` };
  }

  const res = UrlFetchApp.fetch(CONFIG.API_ENDPOINT, options);
  if (res.getResponseCode() >= 400) {
    throw new Error(`API ${res.getResponseCode()} : ${res.getContentText()}`);
  }
}

function getOrCreateLabel(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

function setupTrigger() {
  ScriptApp.newTrigger('processPDFs').timeBased().everyMinutes(10).create();
}

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
import prisma from '../lib/prisma';

dotenv.config();

/**
 * Parse email body to extract recipe data.
 * Expected email format (flexible):
 *
 * TITRE: Nom de la recette
 * DESCRIPTION: Description courte
 * TEMPS_PREP: 15
 * TEMPS_CUISSON: 30
 * PORTIONS: 4
 * SAISONS: SPRING, SUMMER
 *
 * INGREDIENTS:
 * - 200 g farine
 * - 3 oeufs
 * - 100 ml lait
 *
 * INSTRUCTIONS:
 * Mélangez les ingrédients...
 */
function parseEmailToRecipe(text: string, from: string, userId: string) {
  const lines = text.split('\n').map((l) => l.trim());

  const get = (key: string) => {
    const line = lines.find((l) => l.toLowerCase().startsWith(key.toLowerCase() + ':'));
    return line ? line.slice(key.length + 1).trim() : undefined;
  };

  const title = get('TITRE') || get('TITLE') || `Recette de ${new Date().toLocaleDateString('fr-FR')}`;
  const description = get('DESCRIPTION');
  const prepTime = get('TEMPS_PREP') ? Number(get('TEMPS_PREP')) : undefined;
  const cookTime = get('TEMPS_CUISSON') ? Number(get('TEMPS_CUISSON')) : undefined;
  const servings = get('PORTIONS') ? Number(get('PORTIONS')) : undefined;

  // Parse seasons
  const seasonsRaw = get('SAISONS') || get('SEASONS') || '';
  const validSeasons = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
  const season = seasonsRaw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => validSeasons.includes(s)) as ('SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER')[];

  // Parse ingredients
  const ingStart = lines.findIndex((l) => /^ingredients\s*:/i.test(l));
  const instStart = lines.findIndex((l) => /^instructions?\s*:/i.test(l));

  const ingredientLines =
    ingStart !== -1
      ? lines
          .slice(ingStart + 1, instStart !== -1 ? instStart : undefined)
          .filter((l) => l.startsWith('-'))
      : [];

  const ingredients = ingredientLines.map((line, i) => {
    const cleaned = line.replace(/^-\s*/, '');
    // Try to extract: quantity unit name  e.g. "200 g farine"
    const match = cleaned.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s*([a-zA-Z]+)?\s+(.+)/);
    if (match) {
      return { quantity: match[1], unit: match[2] || undefined, name: match[3], order: i };
    }
    return { name: cleaned, order: i };
  });

  // Parse instructions
  const instructions =
    instStart !== -1
      ? lines
          .slice(instStart + 1)
          .join('\n')
          .trim()
      : text;

  return {
    title,
    description,
    instructions: instructions || text,
    prepTime,
    cookTime,
    servings,
    season,
    source: 'EMAIL' as const,
    emailFrom: from,
    userId,
    ingredients: { create: ingredients },
  };
}

async function processEmailMessage(imap: Imap, seqno: number, attrs: Imap.ImapMessageAttributes) {
  return new Promise<void>((resolve, reject) => {
    const fetch = imap.fetch(attrs.uid, { bodies: [''], markSeen: true });

    fetch.on('message', (msg) => {
      let buffer = '';

      msg.on('body', (stream) => {
        stream.on('data', (chunk: Buffer) => (buffer += chunk.toString('utf8')));
        stream.on('end', async () => {
          try {
            const parsed = await simpleParser(buffer);
            const from = parsed.from?.text || 'unknown';
            const bodyText =
              typeof parsed.text === 'string'
                ? parsed.text
                : typeof parsed.html === 'string'
                ? parsed.html
                : '';

            // Try to find user by sender email
            const senderEmail = parsed.from?.value?.[0]?.address || '';
            const user = senderEmail
              ? await prisma.user.findUnique({ where: { email: senderEmail } })
              : null;

            if (!user) {
              console.log(`⚠️  Email de ${from} ignoré : utilisateur non trouvé`);
              resolve();
              return;
            }

            const recipeData = parseEmailToRecipe(bodyText, from, user.id);

            const recipe = await prisma.recipe.create({
              data: recipeData,
              include: { ingredients: true },
            });

            console.log(`✅ Recette créée depuis email: "${recipe.title}" pour ${user.email}`);
            resolve();
          } catch (err) {
            console.error('Erreur parsing email:', err);
            reject(err);
          }
        });
      });
    });

    fetch.once('error', reject);
    fetch.once('end', resolve);
  });
}

export function startEmailListener() {
  const imap = new Imap({
    user: process.env.IMAP_USER!,
    password: process.env.IMAP_PASSWORD!,
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: Number(process.env.IMAP_PORT) || 993,
    tls: process.env.IMAP_TLS !== 'false',
    tlsOptions: { rejectUnauthorized: false },
  });

  imap.once('ready', () => {
    console.log('📧 Connexion IMAP établie');

    imap.openBox(process.env.IMAP_MAILBOX || 'INBOX', false, (err) => {
      if (err) {
        console.error('Erreur ouverture boîte mail:', err);
        return;
      }

      // Search for unread emails with subject containing "recette" or the configured tag
      const tag = process.env.EMAIL_RECIPE_TAG || 'recette';

      imap.search(['UNSEEN', ['SUBJECT', tag]], async (searchErr, results) => {
        if (searchErr) {
          console.error('Erreur recherche:', searchErr);
          return;
        }

        if (!results || results.length === 0) {
          console.log('Aucun nouveau email recette');
          return;
        }

        console.log(`📬 ${results.length} email(s) à traiter`);

        for (const seqno of results) {
          const attrs = { uid: seqno } as Imap.ImapMessageAttributes;
          await processEmailMessage(imap, seqno, attrs).catch(console.error);
        }
      });

      // Listen for new emails in real time
      imap.on('mail', (numNewMsgs) => {
        console.log(`📨 ${numNewMsgs} nouveau(x) email(s) reçu(s)`);
        imap.search(['UNSEEN', ['SUBJECT', tag]], async (searchErr, results) => {
          if (searchErr || !results?.length) return;
          for (const seqno of results) {
            const attrs = { uid: seqno } as Imap.ImapMessageAttributes;
            await processEmailMessage(imap, seqno, attrs).catch(console.error);
          }
        });
      });
    });
  });

  imap.once('error', (err: Error) => {
    console.error('Erreur IMAP:', err);
    // Retry after 30s
    setTimeout(startEmailListener, 30000);
  });

  imap.once('end', () => {
    console.log('🔌 Connexion IMAP fermée, reconnexion dans 10s...');
    setTimeout(startEmailListener, 10000);
  });

  imap.connect();
}

// Run standalone
if (require.main === module) {
  console.log('🚀 Démarrage du listener email...');
  startEmailListener();
}

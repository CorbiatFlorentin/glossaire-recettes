// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;

export interface ScrapedRecipe {
  title: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients: string[];
  instructions: string;
  imageUrl?: string;
  sourceUrl: string;
}

interface JsonLdRecipe {
  '@type'?: string | string[];
  name?: string;
  description?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string | number;
  recipeIngredient?: string[];
  recipeInstructions?: string | string[] | { text?: string; name?: string }[];
  image?: string | string[] | { url?: string };
}

// ── Helpers communs ──────────────────────────────────────────────────────────

function parseDuration(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return undefined;
  const hours = parseInt(match[1] ?? '0', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  const total = hours * 60 + minutes;
  return total > 0 ? total : undefined;
}

function extractInstructions(raw: JsonLdRecipe['recipeInstructions']): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((step) => (typeof step === 'string' ? step : (step.text ?? step.name ?? '')))
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

function extractImageUrl(image: JsonLdRecipe['image']): string | undefined {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) return image[0];
  return image.url;
}

// ── Scraping HTML / JSON-LD ──────────────────────────────────────────────────

function parseJsonLd(html: string): ScrapedRecipe | null {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const raw = JSON.parse(match[1]) as JsonLdRecipe | { '@graph'?: JsonLdRecipe[] };

      const candidates: JsonLdRecipe[] = [];
      if ('@graph' in raw && Array.isArray((raw as { '@graph': JsonLdRecipe[] })['@graph'])) {
        candidates.push(...(raw as { '@graph': JsonLdRecipe[] })['@graph']);
      } else {
        candidates.push(raw as JsonLdRecipe);
      }

      for (const node of candidates) {
        const type = Array.isArray(node['@type']) ? node['@type'].join(',') : node['@type'] ?? '';
        if (!type.toLowerCase().includes('recipe')) continue;

        const servingsRaw = node.recipeYield;
        let servings: number | undefined;
        if (servingsRaw) {
          const n = parseInt(String(servingsRaw), 10);
          if (!isNaN(n)) servings = n;
        }

        return {
          title: node.name ?? 'Recette sans titre',
          description: node.description,
          prepTime: parseDuration(node.prepTime),
          cookTime: parseDuration(node.cookTime) ?? parseDuration(node.totalTime),
          servings,
          ingredients: node.recipeIngredient ?? [],
          instructions: extractInstructions(node.recipeInstructions),
          imageUrl: extractImageUrl(node.image),
          sourceUrl: '',
        };
      }
    } catch {
      // JSON invalide, on passe au bloc suivant
    }
  }

  return null;
}

function extractTitle(html: string): string {
  const ogMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (ogMatch) return ogMatch[1];
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();
  return 'Recette importée';
}

// ── Parsing PDF ──────────────────────────────────────────────────────────────

function parseNumber(text: string, pattern: RegExp): number | undefined {
  const m = text.match(pattern);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  return isNaN(n) ? undefined : n;
}

function looksLikeInstruction(line: string): boolean {
  // Ligne longue sans chiffre au début → probablement une étape de préparation
  return line.length > 60 && !/^\d/.test(line);
}

function parsePdfText(text: string, url: string): ScrapedRecipe {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const title = lines[0] ?? 'Recette importée';
  const servings = parseNumber(text, /pour\s+(\d+)\s+(?:personnes?|portions?)/i);
  const prepTime = parseNumber(text, /(?:temps\s+de\s+)?pr[ée]paration\s*:?\s*(\d+)\s*min/i);
  const cookTime = parseNumber(text, /(?:temps\s+de\s+)?cuisson\s*:?\s*(\d+)\s*min/i);

  const ingredientIdx = lines.findIndex((l) => /ingr[ée]dient/i.test(l));

  // Section préparation : détection souple (majuscules, tirets, espaces variables)
  const prepIdx = lines.findIndex(
    (l, i) =>
      i > ingredientIdx &&
      /^(?:pr[ée]paration|instructions?|[ée]tapes?|recette|m[ée]thode)\b/i.test(l)
  );

  let ingredients: string[] = [];
  let instructions = '';

  if (ingredientIdx >= 0) {
    const end = prepIdx > ingredientIdx ? prepIdx : lines.length;
    const raw = lines
      .slice(ingredientIdx + 1, end)
      .filter((l) => l.length > 1 && !/^pour\s/i.test(l) && !/ingr[ée]dient/i.test(l))
      .map((l) => l.replace(/^[-•*·]\s*/, '').trim())
      .filter(Boolean);

    // Sépare les vrais ingrédients des lignes d'instructions qui auraient fui dans la section
    const cutoff = raw.findIndex(looksLikeInstruction);
    if (cutoff > 0) {
      ingredients = raw.slice(0, cutoff);
      // Si pas de section préparation trouvée, ce qui suit est les instructions
      if (prepIdx < 0) instructions = raw.slice(cutoff).join('\n');
    } else {
      ingredients = raw;
    }
  }

  if (prepIdx >= 0) {
    instructions = lines.slice(prepIdx + 1).join('\n').trim();
  }

  return { title, servings, prepTime, cookTime, ingredients, instructions, sourceUrl: url };
}

async function scrapeFromPdf(url: string, fetchOptions: RequestInit): Promise<ScrapedRecipe> {
  const response = await fetch(url, fetchOptions);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { text } = await pdfParse(buffer);

  if (!text || text.trim().length < 20) {
    throw new Error('PDF scanné ou vide — aucun texte extractible');
  }

  return parsePdfText(text, url);
}

// ── Point d'entrée public ────────────────────────────────────────────────────

export async function scrapeRecipeFromUrl(url: string): Promise<ScrapedRecipe> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  const fetchOptions: RequestInit = {
    signal: controller.signal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
      Accept: 'text/html,application/xhtml+xml,application/pdf,*/*',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },
  };

  try {
    // Détection PDF par extension ou content-type
    const isPdfByExtension = /\.pdf(\?.*)?$/i.test(url);

    if (isPdfByExtension) {
      return await scrapeFromPdf(url, fetchOptions);
    }

    // Sinon on charge en HTML
    const response = await fetch(url, fetchOptions);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/pdf')) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const { text } = await pdfParse(buffer);
      if (!text || text.trim().length < 20) throw new Error('PDF sans texte');
      return parsePdfText(text, url);
    }

    const html = await response.text();
    const parsed = parseJsonLd(html);
    if (parsed) {
      parsed.sourceUrl = url;
      return parsed;
    }

    return {
      title: extractTitle(html),
      ingredients: [],
      instructions: '',
      sourceUrl: url,
    };
  } finally {
    clearTimeout(timeout);
  }
}

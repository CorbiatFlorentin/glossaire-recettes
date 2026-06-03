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
      .map((step) => {
        if (typeof step === 'string') return step;
        return step.text ?? step.name ?? '';
      })
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

function parseJsonLd(html: string): ScrapedRecipe | null {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const raw = JSON.parse(match[1]) as JsonLdRecipe | { '@graph'?: JsonLdRecipe[] };

      // Handle @graph arrays (common in WordPress/Yoast SEO)
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
      // Invalid JSON, continue to next script tag
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

export async function scrapeRecipeFromUrl(url: string): Promise<ScrapedRecipe> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const parsed = parseJsonLd(html);
    if (parsed) {
      parsed.sourceUrl = url;
      return parsed;
    }

    // Fallback: return minimal data with just the page title
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

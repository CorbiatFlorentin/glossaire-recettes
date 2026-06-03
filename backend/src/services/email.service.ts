import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY,
    },
  });
}

interface RecipeEmailData {
  title: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  season: string[];
  instructions: string;
  ingredients: { name: string; quantity?: string; unit?: string }[];
  photoUrl?: string;
}

const SEASON_LABELS: Record<string, string> = {
  SPRING: 'Printemps', SUMMER: 'Été', AUTUMN: 'Automne', WINTER: 'Hiver',
};

function buildRecipeHtml(recipe: RecipeEmailData, senderName: string, personalMessage?: string): string {
  const seasons = recipe.season.map((s) => SEASON_LABELS[s] ?? s).join(', ');

  const metaItems = [
    recipe.prepTime && `<span style="margin-right:16px">⏱ Préparation : <strong>${recipe.prepTime} min</strong></span>`,
    recipe.cookTime && `<span style="margin-right:16px">🔥 Cuisson : <strong>${recipe.cookTime} min</strong></span>`,
    recipe.servings && `<span>🍽 Portions : <strong>${recipe.servings}</strong></span>`,
  ].filter(Boolean).join('');

  const ingredientsList = recipe.ingredients
    .map((i) => `<li style="margin-bottom:4px">${[i.quantity, i.unit, i.name].filter(Boolean).join(' ')}</li>`)
    .join('');

  const instructionBlocks = recipe.instructions
    .split('\n')
    .filter(Boolean)
    .map((line, idx) => `<p style="margin:0 0 10px"><strong>${idx + 1}.</strong> ${line}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5efe6;font-family:Georgia,serif">
  <div style="max-width:600px;margin:32px auto;background:#fdf8f3;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">

    ${recipe.photoUrl ? `<img src="${recipe.photoUrl}" alt="${recipe.title}" style="width:100%;height:240px;object-fit:cover;display:block">` : ''}

    <div style="padding:32px">

      ${personalMessage ? `<div style="background:#f0ebe3;border-left:4px solid #c4956a;padding:14px 16px;border-radius:0 8px 8px 0;margin-bottom:24px;font-style:italic;color:#5c4a3a">${personalMessage}</div>` : ''}

      <h1 style="margin:0 0 8px;font-size:28px;color:#3d2c1e">${recipe.title}</h1>

      ${seasons ? `<p style="margin:0 0 16px;font-size:13px;color:#a07850;text-transform:uppercase;letter-spacing:.05em">${seasons}</p>` : ''}

      ${recipe.description ? `<p style="margin:0 0 20px;color:#6b5744;line-height:1.6">${recipe.description}</p>` : ''}

      ${metaItems ? `<div style="background:#f0ebe3;border-radius:8px;padding:12px 16px;margin-bottom:24px;font-size:14px;color:#5c4a3a">${metaItems}</div>` : ''}

      ${ingredientsList ? `
      <h2 style="font-size:18px;color:#3d2c1e;margin:0 0 12px;border-bottom:2px solid #e8ddd0;padding-bottom:8px">Ingrédients</h2>
      <ul style="margin:0 0 24px;padding-left:20px;color:#5c4a3a;line-height:1.7">${ingredientsList}</ul>
      ` : ''}

      <h2 style="font-size:18px;color:#3d2c1e;margin:0 0 12px;border-bottom:2px solid #e8ddd0;padding-bottom:8px">Instructions</h2>
      <div style="color:#5c4a3a;line-height:1.7;margin-bottom:32px">${instructionBlocks}</div>

      <div style="border-top:1px solid #e8ddd0;padding-top:16px;font-size:12px;color:#b0957a;text-align:center">
        Partagé par <strong>${senderName}</strong> depuis <em>Mes Recettes</em>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendRecipeEmail(opts: {
  to: string;
  fromName: string;
  fromEmail: string;
  recipe: RecipeEmailData;
  personalMessage?: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Service email non configuré (RESEND_API_KEY manquant)');
  }

  const transporter = createTransporter();
  const html = buildRecipeHtml(opts.recipe, opts.fromName, opts.personalMessage);

  await transporter.sendMail({
    from: `"${opts.fromName} via Mes Recettes" <${process.env.EMAIL_FROM ?? 'noreply@mesrecettes.app'}>`,
    replyTo: opts.fromEmail,
    to: opts.to,
    subject: `Recette partagée : ${opts.recipe.title}`,
    html,
  });
}

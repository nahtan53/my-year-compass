#!/usr/bin/env node
/**
 * Migration recettes Obsidian (.md) → Supabase
 *
 * Usage:
 *   node scripts/migrate-recipes-from-md.js <dossier-obsidian>
 *
 * Exemple:
 *   node scripts/migrate-recipes-from-md.js ~/Obsidian/Mes\ recettes
 *
 * Format Obsidian supporté (ex. MOC, Temps total : 20', ## 🥑 Ingérdients, ## Étapes) :
 *   - Titre : nom du fichier (ou frontmatter title)
 *   - Durée : "Temps total : 20'" ou "60'" ou "30 min" ou "1 h"
 *   - Ingrédients : section ## ... Ingrédients / Ingérdients (avec ou sans emoji) puis listes -
 *   - Étapes : section ## Étapes / Préparation puis listes - ou 1. 2.
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
  console.error('Usage: node scripts/migrate-recipes-from-md.js <dossier-obsidian>');
  console.error('Exemple: node scripts/migrate-recipes-from-md.js ./mes-recettes');
  process.exit(1);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { front: null, body: content };
  const front = {};
  match[1].split('\n').forEach((line) => {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) front[m[1]] = m[2].trim();
  });
  return { front: front, body: content.slice(match[0].length) };
}

function parseRecipe(filePath, raw) {
  const { front, body } = parseFrontmatter(raw);
  const lines = body.split(/\r?\n/);
  let title = (front && front.title) || path.basename(filePath, path.extname(filePath));
  let ingredients = [];
  let steps = [];
  let durationMinutes = null;

  // Titre : frontmatter ou nom du fichier (les notes Obsidian ont souvent MOC / Pour combien en premier, pas de vrai titre)
  if (!front || !front.title) {
    const titleLine = lines.find((l) => l.match(/^#\s+[^#]/) && !l.includes('MOC') && !l.includes('Pour combien') && !l.includes('Temps total'));
    if (titleLine) title = titleLine.replace(/^#+\s*/, '').trim();
  }

  if (front && front.duration_minutes != null) {
    durationMinutes = parseInt(String(front.duration_minutes), 10) || null;
  }

  const isSeparator = (s) => /^---+$/.test(s.trim()) || s.trim() === '';

  let section = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Section Ingrédients : ## 🥑 Ingérdients (typo: r après é) ou ## Ingrédients
    if (/^##\s*.*Ingr?[eé]r?dients/i.test(line)) {
      section = 'ingredients';
      continue;
    }
    if (/^##\s*(préparation|étapes|steps|instructions)/i.test(line)) {
      section = 'steps';
      continue;
    }
    if (section === 'ingredients') {
      if (isSeparator(line)) continue;
      const bullet = line.replace(/^\s*[-*]\s*/, '').trim();
      if (bullet && !bullet.startsWith('#')) ingredients.push(bullet);
    }
    if (section === 'steps') {
      if (isSeparator(line)) continue;
      const bullet = line.replace(/^\s*[-*]\s*/, '').replace(/^\s*\d+[.)]\s*/, '').trim();
      if (bullet && !bullet.startsWith('#')) steps.push(bullet);
    }
    // Durée : "Temps total : 20'" ou "#### Temps total : 60'" (apostrophe = minutes)
    if (!durationMinutes && /Temps total\s*:\s*(\d+)\s*'?/i.test(line)) {
      const m = line.match(/Temps total\s*:\s*(\d+)\s*'?/i);
      if (m) durationMinutes = parseInt(m[1], 10);
    }
    if (!durationMinutes && /(\d+)\s*min/i.test(line)) {
      const m = line.match(/(\d+)\s*min/i);
      if (m) durationMinutes = parseInt(m[1], 10);
    }
    if (!durationMinutes && /(\d+)\s*h(?:eu?re?s?)?/i.test(line)) {
      const m = line.match(/(\d+)\s*h(?:eu?re?s?)?/i);
      if (m) durationMinutes = parseInt(m[1], 10) * 60;
    }
  }

  return {
    title: title.replace(/'/g, "''"),
    ingredients,
    steps,
    durationMinutes,
  };
}

function toSql(recipe) {
  const id = randomUUID();
  const ingJson = JSON.stringify(recipe.ingredients);
  const stepsJson = JSON.stringify(recipe.steps);
  const dur = recipe.durationMinutes != null ? recipe.durationMinutes : 'NULL';
  const titleEsc = recipe.title.replace(/'/g, "''");
  const ingEsc = ingJson.replace(/'/g, "''");
  const stepsEsc = stepsJson.replace(/'/g, "''");
  return `INSERT INTO public.recipes (id, title, ingredients, steps, duration_minutes) VALUES ('${id}', '${titleEsc}', '${ingEsc}'::jsonb, '${stepsEsc}'::jsonb, ${dur}) ON CONFLICT (id) DO NOTHING;`;
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
const recipes = [];
for (const f of files) {
  const full = path.join(dir, f);
  if (!fs.statSync(full).isFile()) continue;
  const raw = fs.readFileSync(full, 'utf8');
  try {
    const r = parseRecipe(full, raw);
    if (r.title) recipes.push(r);
  } catch (e) {
    console.error('Erreur fichier', f, e.message);
  }
}

if (recipes.length === 0) {
  console.error('Aucune recette trouvée. Vérifie le format des .md (sections ## Ingrédients, ## Préparation).');
  process.exit(1);
}

console.log('-- Migration recettes Obsidian → Supabase');
console.log('-- Copie le bloc ci-dessous dans Supabase → SQL Editor → Run\n');
recipes.forEach((r) => console.log(toSql(r)));

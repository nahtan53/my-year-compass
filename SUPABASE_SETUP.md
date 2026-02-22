# Configurer Supabase pour My Year Compass

Actuellement **aucune base Supabase n’est utilisée** : l’app tourne uniquement sur des données en mémoire (`src/data/mockData.ts`). Voici comment créer la base et la connecter.

---

## 1. Créer un projet Supabase

1. Va sur [supabase.com](https://supabase.com) et connecte-toi (ou crée un compte).
2. **New project** → choisis un nom (ex. `my-year-compass`), un mot de passe pour la base, une région.
3. Une fois le projet créé, ouvre **Project Settings** (icône engrenage) → **API**.
4. Note :
   - **Project URL** (ex. `https://xxxxx.supabase.co`)
   - **anon public** (clé publique, safe pour le frontend)

---

## 2. Créer les tables dans Supabase

1. Dans le dashboard Supabase : **SQL Editor** → **New query**.
2. Colle et exécute le script fourni dans ce repo : **`supabase/schema.sql`** (à la racine du projet).
3. Vérifie dans **Table Editor** que les tables `goals`, `daily_logs` et `medical_events` existent.

---

## 3. Configurer les variables d’environnement en local

1. À la racine du projet, crée un fichier `.env` (il est ignoré par git).
2. Copie le contenu de `.env.example` et remplis avec tes vraies valeurs :

```env
VITE_SUPABASE_URL=https://TON_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=ta_cle_anon_publique
```

3. Redémarre le serveur de dev (`npm run dev`) après toute modification de `.env`.

---

## 4. (Optionnel) Connexion depuis Lovable

Si tu continues à éditer le projet sur [Lovable](https://lovable.dev) :

- Dans les paramètres du projet Lovable, cherche une option du type **Integrations** ou **Backend** pour **Supabase**.
- Saisis la même **Project URL** et **anon key** que dans ton `.env`.
- Les déploiements Lovable pourront alors utiliser la même base.

(Si tu ne trouves pas cette option, tu peux rester en local avec le `.env` et déployer ailleurs plus tard.)

---

## 5. Brancher l’app sur Supabase

Le repo contient déjà :

- **`src/lib/supabase.ts`** : client Supabase (utilise `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`).
- **`src/lib/supabase-api.ts`** : fonctions pour lire/écrire goals, daily_logs, medical_events.

Quand ta base et ton `.env` sont en place, il suffit de remplacer les imports des mocks par les appels à ces fonctions (voir comment dans les pages `Dashboard`, `HistoryPage`, `MedicalPage`).

Tu peux faire la bascule progressivement (par exemple d’abord les goals, puis les logs, puis les événements médicaux).

---

## Récap

| Étape | Où | Action |
|-------|----|--------|
| 1 | supabase.com | Créer un projet, noter URL + anon key |
| 2 | Supabase → SQL Editor | Exécuter `supabase/schema.sql` |
| 3 | Projet local | Créer `.env` avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` |
| 4 | (Optionnel) Lovable | Configurer Supabase dans les paramètres du projet |
| 5 | Code | Remplacer les mocks par les appels dans `src/lib/supabase-api.ts` |

Si tu veux, on peut détailler l’étape 5 fichier par fichier (Dashboard, History, Medical).

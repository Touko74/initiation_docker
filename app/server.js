const express = require("express");
const os = require("os");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const pool = new Pool(); // lit PGHOST, PGUSER, PGPASSWORD, PGDATABASE
pool.on("error", (err) => console.error("Erreur pool :", err.message));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const COLONNES = "id, nom, categorie, prix::float AS prix, stock";

async function initBase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS produits (
      id SERIAL PRIMARY KEY,
      nom TEXT NOT NULL,
      categorie TEXT NOT NULL,
      prix NUMERIC(10, 2) NOT NULL CHECK (prix >= 0),
      stock INTEGER NOT NULL CHECK (stock >= 0)
    )
  `);
  const { rows } = await pool.query("SELECT COUNT(*) FROM produits");
  if (Number(rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO produits (nom, categorie, prix, stock) VALUES
        ('Cahier A5', 'Papeterie', 2.50, 40),
        ('Stylo bleu', 'Papeterie', 1.20, 120),
        ('Sac à dos', 'Bagagerie', 34.90, 8),
        ('Gourde inox', 'Accessoires', 15.00, 4),
        ('Calculatrice', 'Électronique', 12.90, 25)
    `);
  }
}

// la base peut démarrer après l'API : on réessaie quelques fois
async function initAvecRetry() {
  for (let i = 1; i <= 15; i++) {
    try {
      await initBase();
      console.log("Base prête");
      return;
    } catch (err) {
      console.log(`Base pas prête (${i}/15) : ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

function lireProduit(body) {
  const nom = String(body.nom ?? "").trim();
  const categorie = String(body.categorie ?? "").trim();
  const prix = Number(body.prix);
  const stock = Number(body.stock);
  if (!nom || !categorie) return { erreur: "nom et catégorie obligatoires" };
  if (!Number.isFinite(prix) || prix < 0) return { erreur: "prix invalide" };
  if (!Number.isInteger(stock) || stock < 0) return { erreur: "stock invalide" };
  return { produit: { nom, categorie, prix, stock } };
}

app.get("/api/sante", async (req, res) => {
  let base = "non connectée";
  try {
    await pool.query("SELECT 1");
    base = "connectée";
  } catch (err) {}
  res.json({ base, conteneur: os.hostname() });
});

app.get("/api/produits", async (req, res) => {
  const q = "%" + String(req.query.q ?? "").trim() + "%";
  try {
    const { rows } = await pool.query(
      `SELECT ${COLONNES} FROM produits
       WHERE nom ILIKE $1 OR categorie ILIKE $1
       ORDER BY nom`,
      [q]
    );
    res.json(rows);
  } catch (err) {
    res.status(503).json({ erreur: "base indisponible" });
  }
});

app.post("/api/produits", async (req, res) => {
  const { produit, erreur } = lireProduit(req.body);
  if (erreur) return res.status(400).json({ erreur });
  try {
    const { rows } = await pool.query(
      `INSERT INTO produits (nom, categorie, prix, stock)
       VALUES ($1, $2, $3, $4) RETURNING ${COLONNES}`,
      [produit.nom, produit.categorie, produit.prix, produit.stock]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(503).json({ erreur: "base indisponible" });
  }
});

app.put("/api/produits/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ erreur: "id invalide" });
  const { produit, erreur } = lireProduit(req.body);
  if (erreur) return res.status(400).json({ erreur });
  try {
    const { rows } = await pool.query(
      `UPDATE produits SET nom = $1, categorie = $2, prix = $3, stock = $4
       WHERE id = $5 RETURNING ${COLONNES}`,
      [produit.nom, produit.categorie, produit.prix, produit.stock, id]
    );
    if (rows.length === 0) return res.status(404).json({ erreur: "produit introuvable" });
    res.json(rows[0]);
  } catch (err) {
    res.status(503).json({ erreur: "base indisponible" });
  }
});

app.delete("/api/produits/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ erreur: "id invalide" });
  try {
    const { rowCount } = await pool.query("DELETE FROM produits WHERE id = $1", [id]);
    if (rowCount === 0) return res.status(404).json({ erreur: "produit introuvable" });
    res.status(204).end();
  } catch (err) {
    res.status(503).json({ erreur: "base indisponible" });
  }
});

app.listen(3000, () => console.log("API sur le port 3000"));
initAvecRetry();
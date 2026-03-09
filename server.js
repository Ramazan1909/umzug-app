const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Veritabanı bağlantısı
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Tabloları oluştur
async function tabloOlustur() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS musteriler (
      id          SERIAL PRIMARY KEY,
      angebotsnr  TEXT,
      name        TEXT NOT NULL,
      telefon     TEXT,
      email       TEXT,
      umzugsdatum TEXT,
      notizen     TEXT,
      erstellt    TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS angebote (
      id             SERIAL PRIMARY KEY,
      musteri_id     INTEGER REFERENCES musteriler(id) ON DELETE CASCADE,
      von_strasse    TEXT,
      von_plz        TEXT,
      von_etage      INTEGER,
      nach_strasse   TEXT,
      nach_plz       TEXT,
      nach_etage     INTEGER,
      km             DECIMAL,
      volumen        DECIMAL,
      personen       INTEGER,
      stunden        DECIMAL,
      gesamtpreis    DECIMAL
    );

    CREATE TABLE IF NOT EXISTS moebel (
      id          SERIAL PRIMARY KEY,
      musteri_id  INTEGER REFERENCES musteriler(id) ON DELETE CASCADE,
      raum        TEXT,
      bezeichnung TEXT,
      anzahl      INTEGER,
      m3          DECIMAL
    );
  `);
  console.log('✅ Tablolar hazır');
}

tabloOlustur();

// ─────────────────────────────
// API ENDPOINTLERİ
// ─────────────────────────────

// Tüm müşterileri getir
app.get('/api/musteriler', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM musteriler ORDER BY erstellt DESC'
    );
    res.json(result.rows);
  } catch (hata) {
    res.status(500).json({ hata: hata.message });
  }
});

// Müşteri kaydet
app.post('/api/musteri', async (req, res) => {
  try {
    const { name, telefon, email, 
            umzugsdatum, angebotsnr, notizen } = req.body;

    const result = await db.query(
      `INSERT INTO musteriler 
         (name, telefon, email, umzugsdatum, angebotsnr, notizen)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id`,
      [name, telefon, email, umzugsdatum, angebotsnr, notizen]
    );

    res.json({ basarili: true, id: result.rows[0].id });
  } catch (hata) {
    res.status(500).json({ hata: hata.message });
  }
});

// Müşteri sil
app.delete('/api/musteri/:id', async (req, res) => {
  try {
    await db.query(
      'DELETE FROM musteriler WHERE id = $1',
      [req.params.id]
    );
    res.json({ basarili: true });
  } catch (hata) {
    res.status(500).json({ hata: hata.message });
  }
});

// Test
app.get('/', (req, res) => {
  res.json({ mesaj: 'Umzug App çalisiyor! 🚛' });
});

app.listen(PORT, () => {
  console.log('✅ Sunucu http://localhost:${PORT} adresinde çalisiyor');
});
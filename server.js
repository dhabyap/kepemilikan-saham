const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { spawn } = require('child_process');

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────── DATABASE SETUP ───────────────────────────
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Laragon default is empty password
  database: 'kepemilikan_saham_db'
};

// Create database if it doesn't exist
async function initDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.changeUser({ database: dbConfig.database });
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kepemilikan_saham (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date VARCHAR(50),
        share_code VARCHAR(20) NOT NULL,
        issuer_name VARCHAR(255),
        investor_name VARCHAR(255) NOT NULL,
        investor_type VARCHAR(20),
        local_foreign VARCHAR(10),
        nationality VARCHAR(100),
        domicile VARCHAR(100),
        holdings_scripless BIGINT DEFAULT 0,
        holdings_scrip BIGINT DEFAULT 0,
        total_holding_shares BIGINT DEFAULT 0,
        percentage DECIMAL(10, 2) DEFAULT 0,
        INDEX idx_share_code (share_code),
        INDEX idx_investor_name (investor_name),
        INDEX idx_local_foreign (local_foreign),
        INDEX idx_percentage (percentage)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS konglomerat (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(255),
        nama_grup VARCHAR(255),
        stocks TEXT,
        sector TEXT,
        role VARCHAR(255)
      )
    `);

    // Seed konglomerat data if empty
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM konglomerat');
    if (rows[0].count === 0) {
      if (fs.existsSync(path.join(__dirname, 'konglomerat.json'))) {
        const kongloData = JSON.parse(fs.readFileSync(path.join(__dirname, 'konglomerat.json'), 'utf-8'));
        for (const k of kongloData) {
          await connection.query(`
            INSERT INTO konglomerat (nama, nama_grup, stocks, sector, role) 
            VALUES (?, ?, ?, ?, ?)
          `, [k.konglomerat, k.group, JSON.stringify(k.stocks), JSON.stringify(k.sector), k.role]);
        }
        console.log('✓ Konglomerat data seeded');
      }
    }
    
    console.log('✓ Database and tables initialized');
    await connection.end();
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// ─────────────────────────── UPLOAD CONFIG ───────────────────────────
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'uploaded_data_' + Date.now() + '.pdf');
  }
});

const upload = multer({ storage: storage });

// ─────────────────────────── API ENDPOINTS ───────────────────────────

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Helper to get latest date
async function getLatestDate() {
  const [rows] = await pool.query('SELECT MAX(STR_TO_DATE(date, "%d-%b-%y")) as max_date FROM kepemilikan_saham');
  if (rows[0].max_date) {
    // Determine the raw string format or format it back
    const [rawRows] = await pool.query('SELECT date FROM kepemilikan_saham ORDER BY STR_TO_DATE(date, "%d-%b-%y") DESC LIMIT 1');
    return rawRows.length ? rawRows[0].date : null;
  }
  return null;
}

// Get all available dates
app.get('/api/dates', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT date FROM kepemilikan_saham ORDER BY STR_TO_DATE(date, "%d-%b-%y") DESC');
    res.json(rows.map(r => r.date));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// File upload endpoint
app.post('/api/upload-pdf', upload.single('pdfFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  const pdfPath = req.file.path;
  const jsonPath = path.join(__dirname, 'uploads', `data_${Date.now()}.json`);

  console.log(`Processing uploaded PDF: ${pdfPath}`);

  // Run the python extraction script
  const pythonProcess = spawn('python', [
    path.join(__dirname, 'extract_data.py'),
    pdfPath,
    jsonPath
  ]);

  let extractionError = '';

  pythonProcess.stderr.on('data', (data) => {
    extractionError += data.toString();
    console.error(`Python script warning/error: ${data}`);
  });

  pythonProcess.on('close', async (code) => {
    if (code !== 0) {
      return res.status(500).json({ 
        error: 'Data extraction failed', 
        details: extractionError 
      });
    }

    try {
      // Import extracted JSON to database
      if (!fs.existsSync(jsonPath)) {
        throw new Error('JSON output not found from extraction script');
      }

      console.log('Reading extracted JSON...');
      const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      
      console.log('Clearing old data...');
      await pool.query('TRUNCATE TABLE kepemilikan_saham');

      console.log(`Importing ${rawData.length} records to MySQL...`);
      
      // Batch inserts to not overwhelm MySQL
      const batchSize = 1000;
      for (let i = 0; i < rawData.length; i += batchSize) {
        const batch = rawData.slice(i, i + batchSize);
        const values = batch.map(r => [
          r.date, r.share_code, r.issuer_name, r.investor_name, r.investor_type,
          r.local_foreign, r.nationality, r.domicile, r.holdings_scripless,
          r.holdings_scrip, r.total_holding_shares, r.percentage
        ]);
        
        await pool.query(`
          INSERT INTO kepemilikan_saham 
          (date, share_code, issuer_name, investor_name, investor_type, local_foreign,
           nationality, domicile, holdings_scripless, holdings_scrip, total_holding_shares, percentage)
          VALUES ?
        `, [values]);
        
        console.log(`Inserted ${Math.min(i + batchSize, rawData.length)} / ${rawData.length} records`);
      }

      // Cleanup files after successful import
      fs.unlinkSync(pdfPath);
      fs.unlinkSync(jsonPath);

      res.json({ 
        success: true, 
        message: `Successfully imported ${rawData.length} records` 
      });

    } catch (dbError) {
      console.error('Database import error:', dbError);
      res.status(500).json({ error: 'Failed to save data to database', details: dbError.message });
    }
  });
});

// Summary statistics
app.get('/api/stats', async (req, res) => {
  const date = req.query.date || await getLatestDate();
  try {
    const [[stats]] = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT share_code) as total_issuers,
        COUNT(DISTINCT investor_name) as total_investors,
        ROUND(AVG(percentage), 2) as avg_percentage,
        MAX(percentage) as max_percentage
      FROM kepemilikan_saham
      WHERE date = ? OR ? IS NULL
    `, [date, date]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Top investors by number of companies owned
app.get('/api/top-investors', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const date = req.query.date || await getLatestDate();
  try {
    const [rows] = await pool.query(`
      SELECT 
        investor_name,
        MAX(investor_type) as investor_type,
        MAX(local_foreign) as local_foreign,
        COUNT(DISTINCT share_code) as companies_count,
        SUM(total_holding_shares) as total_shares,
        ROUND(AVG(percentage), 2) as avg_percentage
      FROM kepemilikan_saham
      WHERE date = ? OR ? IS NULL
      GROUP BY investor_name
      ORDER BY companies_count DESC, total_shares DESC
      LIMIT ?
    `, [date, date, limit]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Largest individual holdings by percentage
app.get('/api/top-holdings', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const date = req.query.date || await getLatestDate();
  try {
    const [rows] = await pool.query(`
      SELECT 
        share_code,
        issuer_name,
        investor_name,
        investor_type,
        local_foreign,
        total_holding_shares,
        percentage
      FROM kepemilikan_saham
      WHERE (date = ? OR ? IS NULL)
      ORDER BY percentage DESC
      LIMIT ?
    `, [date, date, limit]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kepemilikan 1% - 5.99% (Fractional Owners)
app.get('/api/fractional-owners', async (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  const date = req.query.date || await getLatestDate();
  try {
    const [rows] = await pool.query(`
      SELECT 
        share_code,
        issuer_name,
        investor_name,
        investor_type,
        local_foreign,
        total_holding_shares,
        percentage
      FROM kepemilikan_saham
      WHERE (date = ? OR ? IS NULL)
        AND percentage >= 1.00 
        AND percentage < 6.00
      ORDER BY percentage DESC
      LIMIT ?
    `, [date, date, limit]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// All issuers with ownership summary
app.get('/api/issuers', async (req, res) => {
  const date = req.query.date || await getLatestDate();
  try {
    const [rows] = await pool.query(`
      SELECT 
        share_code,
        MAX(issuer_name) as issuer_name,
        COUNT(*) as investor_count,
        SUM(total_holding_shares) as total_shares,
        ROUND(SUM(percentage), 2) as total_tracked_pct,
        MAX(percentage) as largest_pct,
        GROUP_CONCAT(DISTINCT local_foreign) as ownership_types
      FROM kepemilikan_saham
      WHERE date = ? OR ? IS NULL
      GROUP BY share_code
      ORDER BY share_code
    `, [date, date]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detail of a specific issuer's shareholders
app.get('/api/issuer/:code', async (req, res) => {
  const date = req.query.date || await getLatestDate();
  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM kepemilikan_saham
      WHERE share_code = ? AND (date = ? OR ? IS NULL)
      ORDER BY percentage DESC
    `, [req.params.code.toUpperCase(), date, date]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Local vs Foreign ownership aggregation 
app.get('/api/local-vs-foreign', async (req, res) => {
  const date = req.query.date || await getLatestDate();
  try {
    const [rows] = await pool.query(`
      SELECT 
        CASE 
          WHEN local_foreign = 'L' THEN 'Lokal'
          WHEN local_foreign = 'A' THEN 'Asing'
          ELSE 'Tidak Diketahui'
        END as category,
        COUNT(*) as record_count,
        COUNT(DISTINCT investor_name) as investor_count,
        COUNT(DISTINCT share_code) as issuer_count,
        SUM(total_holding_shares) as total_shares,
        ROUND(AVG(percentage), 2) as avg_percentage
      FROM kepemilikan_saham
      WHERE date = ? OR ? IS NULL
      GROUP BY local_foreign
      ORDER BY total_shares DESC
    `, [date, date]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Investor type breakdown
app.get('/api/investor-types', async (req, res) => {
  const date = req.query.date || await getLatestDate();
  try {
    const [rows] = await pool.query(`
      SELECT 
        CASE 
          WHEN investor_type = 'CP' THEN 'Korporat'
          WHEN investor_type = 'ID' THEN 'Individu'
          WHEN investor_type = 'IB' THEN 'Inv. Banking'
          WHEN investor_type = 'IS' THEN 'Asuransi'
          WHEN investor_type = 'SC' THEN 'Sekuritas'
          WHEN investor_type = 'FD' THEN 'Yayasan'
          WHEN investor_type = 'MF' THEN 'Reksadana'
          WHEN investor_type = 'PF' THEN 'Dapen'
          WHEN investor_type = 'OT' THEN 'Lainnya'
          WHEN investor_type IS NULL OR investor_type = '' OR investor_type = '-' THEN 'Lainnya'
          ELSE 'Lainnya'
        END as type_label,
        investor_type as type_code,
        COUNT(*) as record_count,
        COUNT(DISTINCT investor_name) as investor_count,
        COUNT(DISTINCT share_code) as issuer_count,
        SUM(total_holding_shares) as total_shares,
        ROUND(AVG(percentage), 2) as avg_percentage
      FROM kepemilikan_saham
      WHERE date = ? OR ? IS NULL
      GROUP BY investor_type
      ORDER BY record_count DESC
    `, [date, date]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search issuers or investors
app.get('/api/search', async (req, res) => {
  const q = `%${(req.query.q || '').toUpperCase()}%`;
  const date = req.query.date || await getLatestDate();
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT
        share_code,
        issuer_name,
        investor_name,
        investor_type,
        local_foreign,
        total_holding_shares,
        percentage
      FROM kepemilikan_saham
      WHERE (UPPER(share_code) LIKE ? 
         OR UPPER(issuer_name) LIKE ? 
         OR UPPER(investor_name) LIKE ?)
         AND (date = ? OR ? IS NULL)
      ORDER BY percentage DESC
      LIMIT 50
    `, [q, q, q, date, date]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Top issuers by number of large shareholders
app.get('/api/most-distributed', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const date = req.query.date || await getLatestDate();
  try {
    const [rows] = await pool.query(`
      SELECT 
        share_code,
        MAX(issuer_name) as issuer_name,
        COUNT(*) as shareholder_count,
        ROUND(SUM(percentage), 2) as total_tracked_pct,
        MAX(percentage) as largest_holding_pct,
        MIN(percentage) as smallest_holding_pct
      FROM kepemilikan_saham
      WHERE date = ? OR ? IS NULL
      GROUP BY share_code
      ORDER BY shareholder_count DESC
      LIMIT ?
    `, [date, date, limit]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Konglomerat List
app.get('/api/konglomerat', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM konglomerat ORDER BY nama ASC');
    // Map text to JSON array where necessary
    const formatted = rows.map(r => ({
      ...r,
      stocks: r.stocks ? JSON.parse(r.stocks) : [],
      sector: r.sector ? JSON.parse(r.sector) : []
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────── START SERVER ───────────────────────────
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Dashboard running at http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api/stats`);
  });
});

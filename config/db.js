const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Laragon default is empty password
  database: 'kepemilikan_saham_db'
};

const pool = mysql.createPool(dbConfig);

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
      // Find the file relative to the project root, not the config foldder
      const jsonPath = path.join(__dirname, '..', 'konglomerat.json');
      if (fs.existsSync(jsonPath)) {
        const kongloData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
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

module.exports = {
  pool,
  initDatabase
};

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kepemilikan_saham_db'
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
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stock_prices (
        share_code VARCHAR(20) PRIMARY KEY,
        price DECIMAL(10, 2) NOT NULL,
        previous_close DECIMAL(10, 2) DEFAULT 0,
        change_percent DECIMAL(10, 2) DEFAULT 0,
        market_cap DECIMAL(20, 2) DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const dummyPrices = [
      // [Ticker, Price, Market Cap in Triliun]
      ['WIFI', 2570, 5.2], ['DATA', 3920, 8.1], ['MINA', 388, 0.4], ['FOLK', 630, 1.2],
      ['TRIN', 1020, 2.5], ['ELTY', 51, 1.1], ['NINE', 143, 0.3], ['VIVA', 41, 0.8],
      ['MENN', 53, 0.2], ['ANDI', 29, 0.1], ['TRUE', 50, 0.5], ['BBCA', 9850, 1214.0],
      ['BBRI', 4850, 735.0], ['TLKM', 2850, 282.0], ['ASII', 5150, 208.0], ['GOTO', 52, 62.1],
      ['CBRE', 55, 0.12], ['RMKO', 340, 1.5], ['SOTS', 210, 0.4], ['BMRI', 6800, 634.0],
      ['BBNI', 5200, 194.0], ['UNVR', 2400, 91.0], ['ICBP', 11500, 134.0], ['INDF', 7000, 61.0],
      ['ADRO', 3600, 115.0], ['UNTR', 25000, 93.0], ['PGAS', 1500, 36.0], ['PTBA', 2800, 32.0],
      ['KLBF', 1600, 75.0], ['ANTM', 1500, 36.0], ['INCO', 4000, 40.0], ['BRPT', 1000, 93.0],
      ['TPIA', 8500, 735.0], ['CPIN', 5000, 82.0], ['AMRT', 3000, 124.0], ['MDKA', 2500, 60.0],
      ['MEDC', 1300, 32.0], ['HRUM', 1350, 18.0], ['INKP', 8000, 43.0], ['TKIM', 7000, 22.0],
      ['BREN', 7000, 936.5], ['CUAN', 8000, 90.0], ['PTRO', 10000, 10.1], ['AMMN', 9000, 650.0]
    ];
    for (const [code, price, cap] of dummyPrices) {
      const capInFull = cap * 1000000000000; // Triliun to Rupiah
      await connection.query('INSERT INTO stock_prices (share_code, price, market_cap) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE price = ?, market_cap = ?', 
        [code, price, capInFull, price, capInFull]);
    }
    console.log('✓ Stock prices & market cap synced');

    
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

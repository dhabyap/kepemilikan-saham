const { pool } = require('../config/db');

class SahamModel {
  static async getDates() {
    const [rows] = await pool.query('SELECT DISTINCT date FROM kepemilikan_saham ORDER BY STR_TO_DATE(date, "%d-%b-%y") DESC');
    return rows.map(r => r.date);
  }

  static async getLatestDate() {
    const [rows] = await pool.query('SELECT MAX(STR_TO_DATE(date, "%d-%b-%y")) as max_date FROM kepemilikan_saham');
    if (rows[0].max_date) {
      const [rawRows] = await pool.query('SELECT date FROM kepemilikan_saham ORDER BY STR_TO_DATE(date, "%d-%b-%y") DESC LIMIT 1');
      return rawRows.length ? rawRows[0].date : null;
    }
    return null;
  }

  static async getStats(date) {
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
    return stats;
  }

  static async getTopInvestors(date, limit) {
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
    return rows;
  }

  static async getTopHoldings(date, limit) {
    const [rows] = await pool.query(`
      SELECT 
        id,
        date,
        share_code,
        issuer_name,
        investor_name,
        investor_type,
        local_foreign,
        nationality,
        domicile,
        holdings_scripless,
        holdings_scrip,
        total_holding_shares,
        percentage
      FROM kepemilikan_saham
      WHERE (date = ? OR ? IS NULL)
      ORDER BY percentage DESC
      LIMIT ?
    `, [date, date, limit]);
    return rows;
  }

  static async getFractionalOwners(date, limit) {
    const [rows] = await pool.query(`
      SELECT 
        id,
        date,
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
    return rows;
  }

  static async getIssuers(date) {
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
    return rows;
  }

  static async getIssuerDetail(code, date) {
    const [rows] = await pool.query(`
      SELECT *
      FROM kepemilikan_saham
      WHERE share_code = ? AND (date = ? OR ? IS NULL)
      ORDER BY percentage DESC
    `, [code, date, date]);
    return rows;
  }

  static async getLocalVsForeign(date) {
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
    return rows;
  }

  static async getInvestorTypes(date) {
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
    return rows;
  }

  static async search(q, date) {
    const [rows] = await pool.query(`
      SELECT DISTINCT
        id,
        date,
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
    `, [`%${q}%`, `%${q}%`, `%${q}%`, date, date]);
    return rows;
  }

  static async getMostDistributed(date, limit) {
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
    return rows;
  }

  static async truncate() {
    await pool.query('TRUNCATE TABLE kepemilikan_saham');
  }

  static async bulkInsert(values) {
    await pool.query(`
      INSERT INTO kepemilikan_saham 
      (date, share_code, issuer_name, investor_name, investor_type, local_foreign,
       nationality, domicile, holdings_scripless, holdings_scrip, total_holding_shares, percentage)
      VALUES ?
    `, [values]);
  }

  // --- CRUD Operations ---

  static async update(id, data) {
    await pool.query(`
      UPDATE kepemilikan_saham SET
        share_code = ?,
        issuer_name = ?,
        investor_name = ?,
        investor_type = ?,
        local_foreign = ?,
        total_holding_shares = ?,
        percentage = ?
      WHERE id = ?
    `, [
      data.share_code, 
      data.issuer_name, 
      data.investor_name, 
      data.investor_type, 
      data.local_foreign, 
      data.total_holding_shares, 
      data.percentage, 
      id
    ]);
  }

  static async delete(id) {
    await pool.query('DELETE FROM kepemilikan_saham WHERE id = ?', [id]);
  }
}

module.exports = SahamModel;

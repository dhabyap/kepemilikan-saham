const { pool } = require('../config/db');

class KonglomeratModel {
  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM konglomerat ORDER BY nama ASC');
    return rows.map(r => ({
      ...r,
      stocks: r.stocks ? JSON.parse(r.stocks) : [],
      sector: r.sector ? JSON.parse(r.sector) : []
    }));
  }

  static async create(data) {
    const [result] = await pool.query(`
      INSERT INTO konglomerat (nama, nama_grup, stocks, sector, role) 
      VALUES (?, ?, ?, ?, ?)
    `, [
      data.nama, 
      data.nama_grup, 
      JSON.stringify(data.stocks || []), 
      JSON.stringify(data.sector || []), 
      data.role
    ]);
    return result.insertId;
  }

  static async update(id, data) {
    await pool.query(`
      UPDATE konglomerat SET
        nama = ?,
        nama_grup = ?,
        stocks = ?,
        sector = ?,
        role = ?
      WHERE id = ?
    `, [
      data.nama, 
      data.nama_grup, 
      JSON.stringify(data.stocks || []), 
      JSON.stringify(data.sector || []), 
      data.role,
      id
    ]);
  }

  static async delete(id) {
    await pool.query('DELETE FROM konglomerat WHERE id = ?', [id]);
  }
}

module.exports = KonglomeratModel;

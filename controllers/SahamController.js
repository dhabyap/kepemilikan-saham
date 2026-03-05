const SahamService = require('../services/SahamService');

class SahamController {
  static async getDates(req, res) {
    try {
      const dates = await SahamService.getDates();
      res.json(dates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTopHoldings(req, res) {
    const limit = parseInt(req.query.limit) || 20;
    try {
      const rows = await SahamService.getTopHoldings(req.query.date, limit);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getFractionalOwners(req, res) {
    const limit = parseInt(req.query.limit) || 30;
    try {
      const rows = await SahamService.getFractionalOwners(req.query.date, limit);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getIssuers(req, res) {
    try {
      const rows = await SahamService.getIssuers(req.query.date);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getIssuerDetail(req, res) {
    try {
      const rows = await SahamService.getIssuerDetail(req.params.code, req.query.date);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async search(req, res) {
    try {
      const rows = await SahamService.search(req.query.q, req.query.date);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // --- CRUD Admin ---
  static async updateSaham(req, res) {
    try {
      await SahamService.updateSaham(req.params.id, req.body);
      res.json({ success: true, message: 'Saham updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteSaham(req, res) {
    try {
      await SahamService.deleteSaham(req.params.id);
      res.json({ success: true, message: 'Saham deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = SahamController;

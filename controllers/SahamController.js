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

  static async searchInvestors(req, res) {
    try {
      const rows = await SahamService.searchInvestors(req.query.q, req.query.date);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getInvestorNetwork(req, res) {
    try {
      const investor = req.query.investor;
      if (!investor) return res.status(400).json({ error: 'investor query param required' });
      const data = await SahamService.getInvestorNetwork(investor, req.query.date);
      res.json(data);
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

  static async getInvestorDetail(req, res) {
    try {
      const name = req.params.name;
      const data = await SahamService.getInvestorDetail(name, req.query.date);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getStockPrices(req, res) {
    try {
      const [rows] = await pool.query('SELECT * FROM stock_prices');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getStockPrice(req, res) {
    try {
      const [rows] = await pool.query('SELECT * FROM stock_prices WHERE share_code = ?', [req.params.symbol]);
      res.json(rows[0] || {});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPortfolioValue(req, res) {
    try {
      const data = await SahamService.getInvestorDetail(req.params.name, req.query.date);
      res.json({
        investor: req.params.name,
        total_value: data.portfolio_value,
        total_stocks: data.total_stocks
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = SahamController;

const StatsService = require('../services/StatsService');

class StatsController {
  static async getStats(req, res) {
    try {
      const stats = await StatsService.getStats(req.query.date);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTopInvestors(req, res) {
    const limit = parseInt(req.query.limit) || 20;
    try {
      const rows = await StatsService.getTopInvestors(req.query.date, limit);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getLocalVsForeign(req, res) {
    try {
      const rows = await StatsService.getLocalVsForeign(req.query.date);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getInvestorTypes(req, res) {
    try {
      const rows = await StatsService.getInvestorTypes(req.query.date);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getMostDistributed(req, res) {
    const limit = parseInt(req.query.limit) || 20;
    try {
      const rows = await StatsService.getMostDistributed(req.query.date, limit);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = StatsController;

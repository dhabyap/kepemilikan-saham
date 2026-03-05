const KonglomeratService = require('../services/KonglomeratService');

class KonglomeratController {
  static async getAll(req, res) {
    try {
      const formatted = await KonglomeratService.getAll();
      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      await KonglomeratService.create(req.body);
      res.json({ success: true, message: 'Konglomerat created' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      await KonglomeratService.update(req.params.id, req.body);
      res.json({ success: true, message: 'Konglomerat updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      await KonglomeratService.delete(req.params.id);
      res.json({ success: true, message: 'Konglomerat deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = KonglomeratController;

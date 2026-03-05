const KonglomeratModel = require('../models/KonglomeratModel');

class KonglomeratService {
  static async getAll() {
    return await KonglomeratModel.getAll();
  }

  static async create(data) {
    return await KonglomeratModel.create(data);
  }

  static async update(id, data) {
    return await KonglomeratModel.update(id, data);
  }

  static async delete(id) {
    return await KonglomeratModel.delete(id);
  }
}

module.exports = KonglomeratService;

const SahamModel = require('../models/SahamModel');

class SahamService {
  static async getDates() {
    return await SahamModel.getDates();
  }

  static async getLatestDate(date) {
    return date || await SahamModel.getLatestDate();
  }

  static async getTopHoldings(date, limit) {
    const activeDate = await this.getLatestDate(date);
    return await SahamModel.getTopHoldings(activeDate, limit);
  }

  static async getFractionalOwners(date, limit) {
    const activeDate = await this.getLatestDate(date);
    return await SahamModel.getFractionalOwners(activeDate, limit);
  }

  static async getIssuers(date) {
    const activeDate = await this.getLatestDate(date);
    return await SahamModel.getIssuers(activeDate);
  }

  static async getIssuerDetail(code, date) {
    const activeDate = await this.getLatestDate(date);
    return await SahamModel.getIssuerDetail(code, activeDate);
  }

  static async search(q, date) {
    const activeDate = await this.getLatestDate(date);
    return await SahamModel.search(q || '', activeDate);
  }

  static async updateSaham(id, data) {
    return await SahamModel.update(id, data);
  }

  static async deleteSaham(id) {
    return await SahamModel.delete(id);
  }
}

module.exports = SahamService;

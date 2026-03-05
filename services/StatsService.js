const SahamModel = require('../models/SahamModel');

class StatsService {
  static async getLatestDate(date) {
    return date || await SahamModel.getLatestDate();
  }

  static async getStats(date) {
    const activeDate = await this.getLatestDate(date);
    return await SahamModel.getStats(activeDate);
  }

  static async getTopInvestors(date, limit) {
    const activeDate = await this.getLatestDate(date);
    return await SahamModel.getTopInvestors(activeDate, limit);
  }

  static async getLocalVsForeign(date) {
    const activeDate = await this.getLatestDate(date);
    return await SahamModel.getLocalVsForeign(activeDate);
  }

  static async getInvestorTypes(date) {
    const activeDate = await this.getLatestDate(date);
    return await SahamModel.getInvestorTypes(activeDate);
  }

  static async getMostDistributed(date, limit) {
    const activeDate = await this.getLatestDate(date);
    return await SahamModel.getMostDistributed(activeDate, limit);
  }
}

module.exports = StatsService;

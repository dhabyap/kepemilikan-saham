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

  static async searchInvestors(q, date) {
    const activeDate = await this.getLatestDate(date);
    return await SahamModel.searchInvestors(q || '', activeDate);
  }

  static async getInvestorNetwork(investorName, date) {
    const activeDate = await this.getLatestDate(date);
    return await SahamModel.getInvestorNetwork(investorName, activeDate);
  }

  static async updateSaham(id, data) {
    return await SahamModel.update(id, data);
  }

  static async deleteSaham(id) {
    return await SahamModel.delete(id);
  }
  static async getInvestorDetail(name, date) {
    const activeDate = await this.getLatestDate(date);
    const data = await SahamModel.getInvestorDetail(name, activeDate);
    
    if (!data || data.length === 0) return data;

    // Load conglomerate mapping
    let conglomerates = [];
    try {
      const fs = require('fs');
      const path = require('path');
      const conglomPath = path.join(__dirname, '../konglomerat.json');
      if (fs.existsSync(conglomPath)) {
        conglomerates = JSON.parse(fs.readFileSync(conglomPath, 'utf8'));
      }
    } catch (err) {
      console.error('Error loading conglomerates.json:', err);
    }

    const totalPortfolioValue = data.reduce((sum, item) => sum + parseFloat(item.market_value), 0);
    let influenceScore = 0;
    let largestHolding = { stock: '-', percentage: 0 };

    const processedHoldings = data.map(item => {
      const marketCap = parseFloat(item.market_cap) || 0;
      const ownershipPct = parseFloat(item.percentage) || 0;
      const val = parseFloat(item.market_value) || 0;
      const allocation = totalPortfolioValue > 0 ? (val / totalPortfolioValue) * 100 : 0;
      
      // Calculate Influence Score contribution
      influenceScore += (ownershipPct / 100) * marketCap;

      // Track largest holding
      if (allocation > largestHolding.percentage) {
        largestHolding = { stock: item.share_code, percentage: allocation };
      }

      // Find conglomerate
      const conglom = conglomerates.find(c => c.stocks.includes(item.share_code));

      return {
        ...item,
        price: parseFloat(item.current_price) || 0,
        change_percent: parseFloat(item.change_percent) || 0,
        allocation: allocation.toFixed(2) + '%',
        conglomerate: conglom ? conglom.konglomerat : 'Independent/Unknown'
      };
    });

    // Determine concentration
    let concentration = 'Diversified';
    if (largestHolding.percentage > 50) concentration = 'High';
    else if (largestHolding.percentage >= 25) concentration = 'Medium';

    // Determine investor type based on influence (Value of companies they have stake in)
    // Scale: > 100T = Market Mover, > 10T = Strategic, else Passive
    let type = 'Passive Investor';
    if (influenceScore >= 100000000000000) type = 'Market Mover';
    else if (influenceScore >= 10000000000000) type = 'Strategic Investor';

    return {
      investor: name,
      portfolio_value: totalPortfolioValue,
      total_stocks: data.length,
      largest_holding: largestHolding.stock,
      portfolio_concentration: concentration,
      investor_type_insight: type,
      influence_score: influenceScore,
      holdings: processedHoldings
    };
  }
}

module.exports = SahamService;

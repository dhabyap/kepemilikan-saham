const axios = require('axios');
const { pool } = require('../config/db');

class PriceSyncService {
  /**
   * Fetch single stock price from Yahoo Finance
   * @param {string} symbol - Equity symbol without suffix (e.g. 'BBCA')
   */
  static async fetchPriceFromYahoo(symbol) {
    try {
      const ticker = `${symbol.toUpperCase()}.JK`;
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const meta = response.data?.chart?.result?.[0]?.meta;
      if (!meta) return null;

      return {
        price: meta.regularMarketPrice,
        previous_close: meta.chartPreviousClose,
        symbol: symbol.toUpperCase(),
        timestamp: meta.regularMarketTime
      };
    } catch (error) {
      console.error(`[PriceSync] Failed to fetch ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Update or Insert price into database
   */
  static async updateStockPrice(data) {
    if (!data) return;
    
    const changePct = data.previous_close 
      ? ((data.price - data.previous_close) / data.previous_close) * 100 
      : 0;

    await pool.query(`
      INSERT INTO stock_prices (share_code, price, previous_close, change_percent)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        price = VALUES(price),
        previous_close = VALUES(previous_close),
        change_percent = VALUES(change_percent),
        last_updated = CURRENT_TIMESTAMP
    `, [data.symbol, data.price, data.previous_close, changePct]);
  }

  /**
   * Sync all unique stocks found in the ownership database
   */
  static async syncAllActiveStocks() {
    console.log('[PriceSync] Syncing all active stocks...');
    const [stocks] = await pool.query('SELECT DISTINCT share_code FROM kepemilikan_saham');
    
    for (const row of stocks) {
      const symbol = row.share_code;
      const data = await this.fetchPriceFromYahoo(symbol);
      if (data) {
        await this.updateStockPrice(data);
        console.log(`[PriceSync] Updated ${symbol}: Rp ${data.price}`);
      }
      // Small delay to be polite to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log(`[PriceSync] Completed sync for ${stocks.length} stocks`);
  }

  /**
   * Start periodic sync
   */
  static startAutoSync(intervalMinutes = 5) {
    console.log(`[PriceSync] Auto-sync started every ${intervalMinutes} minutes`);
    // Initial sync
    this.syncAllActiveStocks();
    
    setInterval(() => {
      this.syncAllActiveStocks();
    }, intervalMinutes * 60 * 1000);
  }
}

module.exports = PriceSyncService;

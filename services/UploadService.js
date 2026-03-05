const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const SahamModel = require('../models/SahamModel');

class UploadService {
  static async processPdf(file) {
    const pdfPath = file.path;
    const jsonPath = path.join(__dirname, '..', 'uploads', `data_${Date.now()}.json`);

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        path.join(__dirname, '..', 'extract_data.py'),
        pdfPath,
        jsonPath
      ]);

      let extractionError = '';

      pythonProcess.stderr.on('data', (data) => {
        extractionError += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        if (code !== 0) {
          return reject({ error: 'Data extraction failed', details: extractionError });
        }

        try {
          if (!fs.existsSync(jsonPath)) {
            throw new Error('JSON output not found from extraction script');
          }

          const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
          
          await SahamModel.truncate();

          const batchSize = 1000;
          for (let i = 0; i < rawData.length; i += batchSize) {
            const batch = rawData.slice(i, i + batchSize);
            const values = batch.map(r => [
              r.date, r.share_code, r.issuer_name, r.investor_name, r.investor_type,
              r.local_foreign, r.nationality, r.domicile, r.holdings_scripless,
              r.holdings_scrip, r.total_holding_shares, r.percentage
            ]);
            
            await SahamModel.bulkInsert(values);
          }

          fs.unlinkSync(pdfPath);
          fs.unlinkSync(jsonPath);

          resolve({ success: true, count: rawData.length });

        } catch (dbError) {
          reject({ error: 'Failed to save data to database', details: dbError.message });
        }
      });
    });
  }
}

module.exports = UploadService;

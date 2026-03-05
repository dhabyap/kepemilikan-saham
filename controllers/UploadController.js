const UploadService = require('../services/UploadService');

class UploadController {
  static async uploadPdf(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    try {
      const result = await UploadService.processPdf(req.file);
      res.json({ 
        success: true, 
        message: `Successfully imported ${result.count} records` 
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: error.error || 'Upload failed', 
        details: error.details || error.message 
      });
    }
  }
}

module.exports = UploadController;

const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const AuthController = require('../controllers/AuthController');
const UploadController = require('../controllers/UploadController');
const SahamController = require('../controllers/SahamController');
const StatsController = require('../controllers/StatsController');
const KonglomeratController = require('../controllers/KonglomeratController');

// --- Auth & Upload ---
router.post('/login', AuthController.login);
router.get('/verify', verifyToken, AuthController.verify);
router.post('/upload-pdf', verifyToken, upload.single('pdfFile'), UploadController.uploadPdf);

// --- Stats & Visualizations ---
router.get('/stats', StatsController.getStats);
router.get('/top-investors', StatsController.getTopInvestors);
router.get('/local-vs-foreign', StatsController.getLocalVsForeign);
router.get('/investor-types', StatsController.getInvestorTypes);
router.get('/most-distributed', StatsController.getMostDistributed);

// --- Saham Queries ---
router.get('/dates', SahamController.getDates);
router.get('/top-holdings', SahamController.getTopHoldings);
router.get('/fractional-owners', SahamController.getFractionalOwners);
router.get('/issuers', SahamController.getIssuers);
router.get('/issuer/:code', SahamController.getIssuerDetail);
router.get('/search', SahamController.search);
router.get('/investor-network', SahamController.getInvestorNetwork);
router.get('/investors/search', SahamController.searchInvestors);
router.get('/investor/:name', SahamController.getInvestorDetail);

// --- New Stock Price Endpoints ---
router.get('/stocks/prices', SahamController.getStockPrices);
router.get('/stocks/:symbol', SahamController.getStockPrice);
router.get('/portfolio/value/:name', SahamController.getPortfolioValue);

// --- Saham CRUD (Protected) ---
router.put('/saham/:id', verifyToken, SahamController.updateSaham);
router.delete('/saham/:id', verifyToken, SahamController.deleteSaham);

// --- Konglomerat Queries & CRUD ---
router.get('/konglomerat', KonglomeratController.getAll);
router.post('/konglomerat', verifyToken, KonglomeratController.create);
router.put('/konglomerat/:id', verifyToken, KonglomeratController.update);
router.delete('/konglomerat/:id', verifyToken, KonglomeratController.delete);

module.exports = router;

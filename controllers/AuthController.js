const AuthService = require('../services/AuthService');

class AuthController {
  static login(req, res) {
    const { username, password } = req.body;
    const result = AuthService.login(username, password);
    
    if (result.success) {
      res.json({ token: result.token, message: 'Login successful' });
    } else {
      res.status(401).json({ error: result.error });
    }
  }

  static verify(req, res) {
    const result = AuthService.verify(req.user);
    res.json(result);
  }
}

module.exports = AuthController;

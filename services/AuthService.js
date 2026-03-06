const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

class AuthService {
  static login(username, password) {
    const adminUsername = process.env.ADMIN_USERNAME || 'dhaby@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '12345678';

    if (username === adminUsername && password === adminPassword) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
      return { success: true, token };
    }
    return { success: false, error: 'Invalid credentials' };
  }

  static verify(user) {
    return { success: true, user };
  }
}

module.exports = AuthService;

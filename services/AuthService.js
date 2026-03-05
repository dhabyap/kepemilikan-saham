const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

class AuthService {
  static login(username, password) {
    if (username === 'dhaby@gmail.com' && password === '12345678') {
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

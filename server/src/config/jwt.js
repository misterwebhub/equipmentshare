require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'changeme_secret_key_123',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'changeme_refresh_key_123',
  expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

require('dotenv').config();

const rawOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const corsOrigin = rawOrigin.includes(',')
  ? rawOrigin.split(',').map(o => o.trim()).filter(Boolean)
  : rawOrigin;

module.exports = {
  port: process.env.PORT || 3001,
  corsOrigin
};

// Serverless wrapper for compiled NestJS app
// This file stays as .ts for Vercel but requires the compiled .js output

const handler = require('./dist/api.js');

module.exports = handler.default || handler;

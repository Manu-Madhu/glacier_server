import logger from '../utils/logger.util.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`);
  return res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: 'INTERNAL_SERVER_ERROR'
  });
};

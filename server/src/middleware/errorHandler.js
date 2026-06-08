const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Record already exists' });
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
};
module.exports = errorHandler;

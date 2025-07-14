function cors(allowedOrigin) {
  return (req, res, next) => {
    // Remove barra do final se existir para evitar problemas de match
    const origin = allowedOrigin.endsWith('/') ? allowedOrigin.slice(0, -1) : allowedOrigin;
    
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, access-control-allow-origin, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  };
}

module.exports = cors;
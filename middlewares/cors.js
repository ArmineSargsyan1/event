function cors(req, res, next) {

  try {
    const {origin = "*", method} = req.headers;

    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', "*");
    res.setHeader('X-Powered-By', 'Ukuleke Inc.');

    if (method === 'OPTIONS') {
      res.status(200).send('Allow: GET, POST, PUT, DELETE, PATCH, OPTIONS');
      return;
    }

    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
}

export default cors;

import jwt from "jsonwebtoken";
import HttpErrors from "http-errors";

import Users from '../models/User.js';



export default async function (req, res, next) {
  let token = req.headers?.authorization;
  console.log(token,999)

  if (!token) {
    next(new HttpErrors(401, 'No token provided'));
    return;
  }

  if (token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }

  let user = null;
  try {
    const data = jwt.verify(token, process.env.AUTH_SECRET);
    console.log(data)
    user = await Users.findByPk(data.id);
  } catch (err) {
    console.error("JWT Error:", err.message);
  }

  if (!user) {
    next(new HttpErrors(401));
    return;
  }

  req.userId = user.id;
  req.role = user.role
  next();
}

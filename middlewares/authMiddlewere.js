import jwt from "jsonwebtoken";
import HttpErrors from "http-errors";

import Users from '../models/User.js';

const {AUTH_SECRET} = process.env;

export default async function (req, res, next) {
  const token = req.headers?.authorization;

  if (!token) {
    next(new HttpErrors(401, 'No token provided'));
    return;
  }

  let user = null;

  try {
    const data = jwt.verify(token, AUTH_SECRET);

    user = await Users.findByPk(data.id);
  } catch (err) {
    ///
  }

  if (!user) {
    next(new HttpErrors(401));
    return;
  }

  req.userId = user.id;
  req.role = user.role
  next();
}

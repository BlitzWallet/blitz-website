"use strict";
import "dotenv/config";

import jwt from "jsonwebtoken";

export function JWTAuth(token) {
  try {
    jwt.verify(token, process.env.JWT_SECRET_KEY);
    return true;

    // {
    //   statusCode: 200,
    //   body: JSON.stringify({ message: "Toekn Verified" }),
    // };
  } catch (error) {
    return false;
    // {
    //   statusCode: 401,
    //   body: JSON.stringify({
    //     message: "No token provided",
    //   }),
    // };
  }
}

const express = require('express');
const _ = require('lodash');
const jwtconfig  = require('./jwtconfig');
const jwt     = require('jsonwebtoken');
const config = require('./config');
const app = module.exports = express.Router();

function createIdToken(user) {
  return jwt.sign(_.omit(user, 'password'), jwtconfig.secret, { expiresIn: 60*60*5 });
}

function createAccessToken() {
  return jwt.sign({
    iss: jwtconfig.issuer,
    aud: jwtconfig.audience,
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
    scope: 'full_access',
    sub: "expense",
    jti: genJti(), // unique identifier for the token
    alg: 'HS256'
  }, jwtconfig.secret);
}

// Generate Unique Identifier for the access token
function genJti() {
  let jti = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 16; i++) {
      jti += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return jti;
}
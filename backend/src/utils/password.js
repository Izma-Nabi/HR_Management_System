const bcrypt = require("bcrypt");
const env = require("../../../global/env");

// bcrypt.compare checks a login password against the stored hash.
// It returns true when the password is correct.
const comparePassword = async (plainPassword, passwordHash) => {
  return bcrypt.compare(plainPassword, passwordHash);
};

const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, env.bcrypt.saltRounds);
};

module.exports = {
  hashPassword,
  comparePassword
};

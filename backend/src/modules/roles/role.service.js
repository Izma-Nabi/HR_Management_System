const repository = require("./role.repository");

const listRoles = async () => {
  return repository.listRoles();
};

module.exports = {
  listRoles
};
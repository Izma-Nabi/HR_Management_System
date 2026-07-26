const repository = require("./role.repository");

const listCreatableRoles = async () => {
  return repository.listCreatableRoles();
};

module.exports = {
  listCreatableRoles
};

const repository = require("./designation.repository");

const listDesignations = async () => {
  return repository.listDesignations();
};

module.exports = {
  listDesignations
};

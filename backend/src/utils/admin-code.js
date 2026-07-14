const ADMIN_CODE_PREFIX = "ADM";
const ADMIN_CODE_WIDTH = 3;

const formatAdminCode = (number) => {
  return `${ADMIN_CODE_PREFIX}${String(number).padStart(ADMIN_CODE_WIDTH, "0")}`;
};

const generateNextAdminCode = async (dbClient) => {
  const prefixOffset = ADMIN_CODE_PREFIX.length + 1;
  const codePattern = `^${ADMIN_CODE_PREFIX}[0-9]+$`;

  const rows = await dbClient.$queryRaw`
    SELECT COALESCE(MAX(CAST(SUBSTRING(userCode, ${prefixOffset}) AS UNSIGNED)), 0) AS maxNumber
    FROM users
    WHERE userCode REGEXP ${codePattern}
  `;

  const maxNumber = Number(rows[0]?.maxNumber || 0);

  return formatAdminCode(maxNumber + 1);
};

module.exports = {
  generateNextAdminCode,
  formatAdminCode
};

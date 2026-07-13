const EMPLOYEE_CODE_PREFIX = "EMP";
const EMPLOYEE_CODE_WIDTH = 3;

const formatEmployeeCode = (number) => {
  return `${EMPLOYEE_CODE_PREFIX}${String(number).padStart(EMPLOYEE_CODE_WIDTH, "0")}`;
};

const generateNextEmployeeCode = async (dbClient) => {
  const prefixOffset = EMPLOYEE_CODE_PREFIX.length + 1;
  const codePattern = `^${EMPLOYEE_CODE_PREFIX}[0-9]+$`;

  const rows = await dbClient.$queryRaw`
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code, ${prefixOffset}) AS UNSIGNED)), 0) AS maxNumber
    FROM employee_profiles
    WHERE employee_code REGEXP ${codePattern}
  `;

  const maxNumber = Number(rows[0]?.maxNumber || 0);

  return formatEmployeeCode(maxNumber + 1);
};

module.exports = {
  generateNextEmployeeCode,
  formatEmployeeCode
};

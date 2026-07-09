// Express does not automatically catch errors thrown inside async functions
// in Express 4. This wrapper forwards rejected promises to error middleware.
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;


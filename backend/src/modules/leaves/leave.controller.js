const createLeave = async (req, res) => {
  res.json({
    success: true,
    message: "Create Leave API"
  });
};

const myLeaves = async (req, res) => {
  res.json({
    success: true,
    message: "My Leaves API"
  });
};

const teamLeaves = async (req, res) => {
  res.json({
    success: true,
    message: "Team Leaves API"
  });
};

const approveLeave = async (req, res) => {
  res.json({
    success: true,
    message: "Leave Approved"
  });
};

const rejectLeave = async (req, res) => {
  res.json({
    success: true,
    message: "Leave Rejected"
  });
};

const cancelLeave = async (req, res) => {
  res.json({
    success: true,
    message: "Leave Cancelled"
  });
};

module.exports = {
  createLeave,
  myLeaves,
  teamLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave
};
const fs = require("fs");
const path = require("path");

const attendanceService = require("../modules/attendance/attendance.service");

const importAttendanceFile = async () => {
  try {
    const filePath = path.join(
      __dirname,
      "../../uploads/attendance/Employee_Attendance_Weekly.xlsx"
    );

    if (!fs.existsSync(filePath)) {
      console.log("Attendance file not found.");
      return;
    }

    const result = await attendanceService.importAttendance({
      path: filePath
    });

    console.log("==================================");
    console.log("Attendance imported successfully.");
    console.log(`Total Rows: ${result.totalRows}`);
    console.log(`Inserted Rows: ${result.insertedRows}`);
    console.log("==================================");

  } catch (error) {
    console.error("Attendance Import Failed");
    console.error(error.message);
  }
};

module.exports = {
  importAttendanceFile
};




// const fs = require("fs");
// const path = require("path");
// const cron = require("node-cron");

// const attendanceService = require("../modules/attendance/attendance.service");

// const attendanceFilePath = path.join(
//   __dirname,
//   "../../uploads/attendance/Employee_Attendance_Weekly.xlsx"
// );

// const importAttendanceFile = async () => {
//   try {
//     if (!fs.existsSync(attendanceFilePath)) {
//       console.log("Attendance Excel file not found.");
//       return;
//     }

//     console.log("Starting attendance import...");

//     const result = await attendanceService.importAttendance({
//       path: attendanceFilePath
//     });

//     console.log(
//       `Attendance imported successfully. Total: ${result.totalRows}, Inserted: ${result.insertedRows}`
//     );
//   } catch (error) {
//     console.error("Attendance import failed:", error.message);
//   }
// };

// const startAttendanceScheduler = () => {
//   console.log("Attendance Scheduler Started.");

//   // Every day at 12:05 AM
//   cron.schedule("5 0 * * *", async () => {
//     console.log("Running scheduled attendance import...");
//     await importAttendanceFile();
//   });
// };

// module.exports = {
//   importAttendanceFile,
//   startAttendanceScheduler
// };
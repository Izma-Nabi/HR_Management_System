const { prisma } = require("../../../../database/prisma");
const attendanceRules = require("../../config/attendance.config");


// Convert AM/PM time to minutes from midnight
const timeToMinutes = (time) => {

  const [timePart, modifier] = time.split(" ");

  let [hours, minutes] = timePart
    .split(":")
    .map(Number);


  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }


  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }


  return hours * 60 + minutes;
};



// Convert Date object to minutes
const dateToMinutes = (date) => {

  return (
    date.getHours() * 60 +
    date.getMinutes()
  );

};



// Difference between minutes
const calculateDifference = (
  start,
  end
) => {

  return Math.max(
    0,
    end - start
  );

};



// Get employee events of one day
const getAttendanceEvents = async (
  userId,
  attendanceDate
)=>{


return prisma.attendance.findMany({

where:{
  userId,
  attendanceDate
},


orderBy:{
 eventTime:"asc"
}

});


};





const calculateWorkingMinutes = (
events
)=>{


let workingMinutes = 0;


let checkIn = null;


let breakStart = null;



for(const event of events){


const time = dateToMinutes(
 new Date(event.eventTime)
);



if(event.eventType==="CHECK_IN"){

checkIn = time;

}



if(event.eventType==="CHECK_OUT" && checkIn!==null){


let duration =
calculateDifference(
 checkIn,
 time
);



if(breakStart){

duration -=
calculateDifference(
 breakStart,
 time
);

breakStart=null;

}


workingMinutes += duration;

checkIn=null;


}



if(event.eventType==="BREAK_START"){

breakStart=time;

}



if(event.eventType==="BREAK_END" && breakStart){

workingMinutes -=
calculateDifference(
 breakStart,
 time
);

breakStart=null;

}


}



return Math.max(
0,
workingMinutes
);


};





const calculateDailySummary = async (
 userId,
 attendanceDate
)=>{


const events =
await getAttendanceEvents(
 userId,
 attendanceDate
);



if(!events.length){

return null;

}



const firstCheckIn =
events.find(
 event =>
 event.eventType==="CHECK_IN"
);



const checkOutEvents =
events.filter(
 event =>
 event.eventType==="CHECK_OUT"
);



const lastCheckOut =
checkOutEvents.length
?
checkOutEvents[
 checkOutEvents.length-1
]
:null;



const workingMinutes =
calculateWorkingMinutes(events);




// Rules

const officeStart =
timeToMinutes(
attendanceRules.office.startTime
);


const expectedMinutes =
attendanceRules.office.workingMinutes;



const actualCheckIn =
firstCheckIn
?
dateToMinutes(
new Date(firstCheckIn.eventTime)
)
:null;



let lateMinutes = 0;


if(actualCheckIn){

const late =
actualCheckIn -
officeStart -
attendanceRules.office.graceMinutes;


lateMinutes =
Math.max(
0,
late
);

}





let overtimeMinutes =
Math.max(
0,
workingMinutes -
expectedMinutes
);



let earlyLeaveMinutes = 0;



if(lastCheckOut){

const officeEnd =
timeToMinutes(
attendanceRules.office.endTime
);


const checkoutMinutes =
dateToMinutes(
new Date(lastCheckOut.eventTime)
);



if(checkoutMinutes < officeEnd){

earlyLeaveMinutes =
officeEnd -
checkoutMinutes;

}

}





let attendanceStatus =
"PRESENT";



if(
workingMinutes===0
){

attendanceStatus="ABSENT";

}
else if(
workingMinutes <
attendanceRules.attendance.halfDayMinutes
){

attendanceStatus="HALF_DAY";

}
else if(
lateMinutes>0
){

attendanceStatus="LATE";

}





return {


userId,


attendanceDate,


firstCheckIn:
firstCheckIn?.eventTime || null,


lastCheckOut:
lastCheckOut?.eventTime || null,


workingMinutes,


lateMinutes,


earlyLeaveMinutes,


overtimeMinutes,


expectedMinutes,


attendanceStatus,


calculatedAt:
new Date()

};


};








const saveAttendanceSummary = async(summary)=>{


return prisma.attendanceSummary.upsert({

where:{

userId_attendanceDate:{

userId:
summary.userId,

attendanceDate:
summary.attendanceDate

}

},


update:summary,


create:summary


});


};






const generateAttendanceSummary = async(
userId,
attendanceDate
)=>{


const summary =
await calculateDailySummary(
userId,
attendanceDate
);



if(!summary){

return null;

}



return saveAttendanceSummary(summary);


};






module.exports={

calculateDailySummary,

generateAttendanceSummary

};
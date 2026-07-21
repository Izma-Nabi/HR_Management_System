const prisma = require("../../../database/prisma");

const requirePermission = (permissionName) => {

  return async (req, res, next) => {

    try {

      const userId = req.user.id;


      const user = await prisma.user.findUnique({

        where:{
          id:userId
        },

        include:{
          role:{
            include:{
              rolePermissions:{
                include:{
                  permission:true
                }
              }
            }
          }
        }

      });



      if(!user){
        return res.status(401).json({
          message:"User not found"
        });
      }



      const hasPermission =
        user.role.rolePermissions.some(
          rp =>
          rp.permission.permissionName === permissionName
        );



      if(!hasPermission){

        return res.status(403).json({

          message:"You do not have permission for this action"

        });

      }



      next();


    } catch(error){

      next(error);

    }

  };

};


module.exports = {
  requirePermission
};
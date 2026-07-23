require('../../global/env')
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const main = async()=>{
    const roles=[
        {
            roleName:'Super Admin'
        },
        {
            roleName:'Admin'
        },
        {
            roleName:'Employee'
        }
    ];

    for (const role of roles) {

        await prisma.role.upsert({
            where: {
            roleName: role.roleName
            },
            update: {},
            create: {
            roleName: role.roleName
            }
        });

        }
    console.log("Roles seeds created sucessfully")
};

main()
    .catch((error)=>{
        console.error(error)
        process.exit(1)
    })
    .finally(async ()=>{
        await prisma.$disconnect();
    });

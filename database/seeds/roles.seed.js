require('../../global/env')
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const main = async()=>{
    const roles=[
        {
            roleName:'SUPER ADMIN'
        },
        {
            roleName:'ADMIN'
        },
        {
            roleName:'EMPLOYEE'
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

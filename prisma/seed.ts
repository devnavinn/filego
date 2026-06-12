import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
    const email = "admin@filego.in";
    const password = "Admin@123456";
    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await prisma.user.findUnique({
        where: { email },
    });

    if (existing) {
        await prisma.user.update({
            where: { email },
            data: {
                role: "ADMIN",
                password: hashedPassword,
                name: "Admin",
            },
        });
        console.log("Admin updated");
        return;
    }

    await prisma.user.create({
        data: {
            name: "Admin",
            email,
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    console.log("Admin created");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create a default company
    const company = await prisma.companies.upsert({
        where: { id: 'default-company-id' },
        update: {},
        create: {
            id: 'default-company-id',
            name: 'Laapak',
            status: 'active',
            subscription_plan: 'pro',
        },
    });

    console.log('Created company:', company.name);

    // 2. Create admin user
    const email = 'admin@laapak.com';
    const password = '620163Z-z';
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.users.upsert({
        where: { email },
        update: {
            password_hash: passwordHash,
            company_id: company.id,
            role: 'admin',
        },
        create: {
            email,
            full_name: 'System Admin',
            role: 'admin',
            password_hash: passwordHash,
            company_id: company.id,
        },
    });

    console.log('Created admin user:', admin.email);

    // 3. Create super_admin user
    const superAdminEmail = 'superadmin@laapak.com';
    const superAdminPassword = '620163Z-z';
    const superAdminHash = await bcrypt.hash(superAdminPassword, 10);

    const superAdmin = await prisma.users.upsert({
        where: { email: superAdminEmail },
        update: {
            password_hash: superAdminHash,
            role: 'super_admin',
        },
        create: {
            email: superAdminEmail,
            full_name: 'Super Administrator',
            role: 'super_admin',
            password_hash: superAdminHash,
        },
    });

    console.log('Created super_admin user:', superAdmin.email);
    console.log('Database seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

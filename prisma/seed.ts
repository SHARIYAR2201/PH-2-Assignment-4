import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gearup.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const adminName = process.env.ADMIN_NAME || 'GearUp Admin';

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: adminName,
      email: adminEmail,
      password: hashedAdminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Admin ready: ${admin.email}`);

  // Sample provider
  const providerPassword = await bcrypt.hash('Provider123!', 12);
  const provider = await prisma.user.upsert({
    where: { email: 'provider@gearup.com' },
    update: {},
    create: {
      name: 'Trailblazer Rentals',
      email: 'provider@gearup.com',
      password: providerPassword,
      role: 'PROVIDER',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Sample provider ready: ${provider.email} / Provider123!`);

  // Sample customer
  const customerPassword = await bcrypt.hash('Customer123!', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@gearup.com' },
    update: {},
    create: {
      name: 'Sam Customer',
      email: 'customer@gearup.com',
      password: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Sample customer ready: ${customer.email} / Customer123!`);

  // Categories
  const categoryNames = ['Cycling', 'Camping', 'Fitness', 'Water Sports', 'Winter Sports'];
  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} gear for rent` },
    });
    categories.push(category);
  }
  console.log(`✅ ${categories.length} categories ready`);

  // Sample gear items
  const cycling = categories.find((c) => c.name === 'Cycling')!;
  const camping = categories.find((c) => c.name === 'Camping')!;

  const existingGear = await prisma.gearItem.findFirst({ where: { title: 'Mountain Bike - Trek Marlin 7' } });
  if (!existingGear) {
    await prisma.gearItem.create({
      data: {
        title: 'Mountain Bike - Trek Marlin 7',
        description: 'A reliable hardtail mountain bike, great for trails and city rides.',
        brand: 'Trek',
        pricePerDay: 15.0,
        quantityTotal: 5,
        images: [],
        categoryId: cycling.id,
        providerId: provider.id,
      },
    });
    await prisma.gearItem.create({
      data: {
        title: '4-Person Camping Tent',
        description: 'Waterproof, easy-setup tent that comfortably fits 4 people.',
        brand: 'Coleman',
        pricePerDay: 10.0,
        quantityTotal: 8,
        images: [],
        categoryId: camping.id,
        providerId: provider.id,
      },
    });
    console.log('✅ Sample gear items created');
  }

  console.log('\n🎉 Seeding complete!');
  console.log('----------------------------------------');
  console.log(`Admin login    -> email: ${adminEmail} | password: ${adminPassword}`);
  console.log('Provider login -> email: provider@gearup.com | password: Provider123!');
  console.log('Customer login -> email: customer@gearup.com | password: Customer123!');
  console.log('----------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

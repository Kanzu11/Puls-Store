import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PulseStore database...');

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('password123', 10);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@pulsestore.local';
  const adminTgUsername = process.env.ADMIN_TELEGRAM_USERNAME || 'admin';

  // 1. Seed Primary Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Store Admin',
      role: 'ADMIN',
      telegramUsername: adminTgUsername,
      passwordHash: adminPasswordHash,
    },
    create: {
      email: adminEmail,
      name: 'Store Admin',
      role: 'ADMIN',
      telegramUsername: adminTgUsername,
      passwordHash: adminPasswordHash,
    },
  });

  // 2. Seed Sample Customers
  const marcus = await prisma.user.upsert({
    where: { email: 'marcus.vance@example.com' },
    update: {
      name: 'Marcus Vance',
      telegramUsername: 'marcusvance',
    },
    create: {
      email: 'marcus.vance@example.com',
      name: 'Marcus Vance',
      role: 'CUSTOMER',
      telegramUsername: 'marcusvance',
      passwordHash: userPasswordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: 'elena.rostova@example.com' },
    update: {
      name: 'Elena Rostova',
      telegramUsername: 'elenarostova',
    },
    create: {
      email: 'elena.rostova@example.com',
      name: 'Elena Rostova',
      role: 'CUSTOMER',
      telegramUsername: 'elenarostova',
      passwordHash: userPasswordHash,
    },
  });

  // 3. Create Categories
  const hardware = await prisma.category.upsert({
    where: { slug: 'hardware' },
    update: {},
    create: {
      name: 'Hardware',
      slug: 'hardware',
      description: 'Precision mechanical tools, keyboards, and input devices.',
    },
  });

  const audio = await prisma.category.upsert({
    where: { slug: 'audio' },
    update: {},
    create: {
      name: 'Audio',
      slug: 'audio',
      description: 'Studio monitoring headphones and acoustic devices.',
    },
  });

  const workspace = await prisma.category.upsert({
    where: { slug: 'workspace' },
    update: {},
    create: {
      name: 'Workspace',
      slug: 'workspace',
      description: 'Minimalist organizers, stands, and desk mats.',
    },
  });

  // 4. Create Products
  const products = [
    {
      name: 'Pulse Monolith Mechanical Keyboard',
      slug: 'pulse-monolith-keyboard',
      description:
        'CNC-milled anodized aluminum chassis with custom lubricated linear switches, hot-swappable PCB, and PBT double-shot keycaps in pure matte black.',
      price: 249.0,
      stock: 35,
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80',
      images: [
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1000&q=80',
      ],
      categoryId: hardware.id,
      isActive: true,
    },
    {
      name: 'Acoustic Studio Over-Ear Headphones',
      slug: 'acoustic-studio-headphones',
      description:
        'Planar magnetic drivers delivering flat frequency response from 10Hz to 45kHz. Lambskin memory foam ear cushions with stainless steel suspension headband.',
      price: 389.0,
      stock: 18,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
      ],
      categoryId: audio.id,
      isActive: true,
    },
    {
      name: 'Solid Walnut Laptop Riser & Stand',
      slug: 'walnut-laptop-riser',
      description:
        'Single-piece curved American black walnut with integrated ventilation channels and non-marring silicone lining. Elevates screen to optimal eye level.',
      price: 89.0,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1000&q=80',
      images: [
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1000&q=80',
      ],
      categoryId: workspace.id,
      isActive: true,
    },
    {
      name: 'Modular Magnetic Fast-Charging Hub',
      slug: 'magnetic-fast-charging-hub',
      description:
        '100W GaN fast charger with 3x USB-C PD 3.1 ports, 1x USB-A port, and an integrated magnetic Qi2 charging puck for smartphone & accessories.',
      price: 119.0,
      stock: 28,
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80',
      images: [
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80',
      ],
      categoryId: hardware.id,
      isActive: true,
    },
    {
      name: 'Full-Grain Leather Desk Pad (90x40cm)',
      slug: 'leather-desk-pad-black',
      description:
        'Vegetable-tanned full-grain leather with suede backing. Water-resistant protective treatment that patinas gracefully over years of daily desk work.',
      price: 75.0,
      stock: 42,
      imageUrl: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=1000&q=80',
      images: [
        'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=1000&q=80',
      ],
      categoryId: workspace.id,
      isActive: true,
    },
    {
      name: 'Precision Aluminum Rotary Macro Pad',
      slug: 'precision-aluminum-macro-pad',
      description:
        '8 programmable mechanical keys + stepped CNC brass rotary encoder for timeline scrubbing, volume mastery, and studio shortcuts.',
      price: 135.0,
      stock: 24,
      imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1000&q=80',
      images: [
        'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1000&q=80',
      ],
      categoryId: hardware.id,
      isActive: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  // 5. Create sample order if none exist
  const existingOrders = await prisma.order.count();
  if (existingOrders === 0) {
    const firstProduct = await prisma.product.findFirst();
    if (firstProduct) {
      await prisma.order.create({
        data: {
          orderNumber: 'PS-1730489201948',
          status: 'PENDING',
          total: firstProduct.price,
          customerName: 'Marcus Vance',
          customerEmail: 'marcus.vance@example.com',
          customerPhone: '+1 (555) 392-1084',
          userId: marcus.id,
          shippingAddress: {
            street: '450 Sutter St Suite 1200',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94108',
            country: 'US',
          },
          items: {
            create: [
              {
                productId: firstProduct.id,
                quantity: 1,
                price: firstProduct.price,
              },
            ],
          },
        },
      });
    }
  }

  console.log(`✅ Seeding completed! Admin verified: @${adminUser.telegramUsername} (${adminUser.email})`);
}

main()
  .catch(e => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


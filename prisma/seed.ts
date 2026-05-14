// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - Seed Data
// Realistic demo data for initial population
// ═══════════════════════════════════════════════════════════════

import { PrismaClient, Prisma } from '@prisma/client';
import { CATEGORY_SEED, DEMO_STATS } from '../src/lib/constants';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function seedCategories() {
  console.log('🌱 Seeding categories...');

  // Sort: parents first (no parentId), then children
  const sorted = [...CATEGORY_SEED].sort((a, b) => {
    if (!a.parentId && b.parentId) return -1;
    if (a.parentId && !b.parentId) return 1;
    return a.sortOrder - b.sortOrder;
  });

  // First pass: create all parents
  for (const cat of sorted.filter(c => !c.parentId)) {
    const data = {
      slug: cat.slug,
      nameEs: cat.nameEs,
      nameEn: cat.nameEn,
      descEs: cat.descEs,
      descEn: cat.descEn,
      icon: cat.icon,
      color: cat.color,
      sortOrder: cat.sortOrder,
      isPaid: cat.isPaid ?? false,
      price: cat.price,
      highlightPrice: cat.highlightPrice,
      vipPrice: cat.vipPrice,
      allowedFields: cat.allowedFields ? JSON.stringify(cat.allowedFields) : '[]',
      showPrice: cat.showPrice ?? true,
      showLocation: cat.showLocation ?? true,
      showImages: cat.showImages ?? true,
      maxImages: cat.maxImages ?? 5,
      expiryDays: cat.expiryDays ?? 30,
    };

    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: data,
      create: data,
    });
  }

  // Second pass: create all children
  const children = sorted.filter((cat) => cat.parentId);
  for (const cat of children) {
    // Verify parent exists
    const parent = await prisma.category.findUnique({ where: { slug: cat.parentId! } });
    if (!parent) {
      console.log(`⚠️  Skipping ${cat.slug}: parent ${cat.parentId} not found`);
      continue;
    }

    const data = {
      slug: cat.slug,
      nameEs: cat.nameEs,
      nameEn: cat.nameEn,
      descEs: cat.descEs,
      descEn: cat.descEn,
      icon: cat.icon,
      color: cat.color,
      parentId: parent.id,
      sortOrder: cat.sortOrder,
      isPaid: cat.isPaid ?? false,
      price: cat.price,
      highlightPrice: cat.highlightPrice,
      vipPrice: cat.vipPrice,
      allowedFields: cat.allowedFields ? JSON.stringify(cat.allowedFields) : '[]',
      showPrice: cat.showPrice ?? true,
      showLocation: cat.showLocation ?? true,
      showImages: cat.showImages ?? true,
      maxImages: cat.maxImages ?? 5,
      expiryDays: cat.expiryDays ?? 30,
    };

    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: data,
      create: data,
    });
  }

  console.log(`✅ ${CATEGORY_SEED.length} categories seeded`);
}

async function seedUsers() {
  console.log('👤 Seeding users...');

  const users = [
    { name: 'María García', email: 'maria@demo.com', role: 'MEMBER', municipality: 'Las Palmas de Gran Canaria', bio: 'Apasionada por el reciclaje y la vida sostenible en Gran Canaria' },
    { name: 'Carlos Rodríguez', email: 'carlos@demo.com', role: 'BUSINESS', municipality: 'Telde', bio: 'Carpintero ecológico. Fabricamos muebles con madera reciclada', businessName: 'EcoMadera GC', businessDescription: 'Carpintería sostenible con materiales reciclados y de origen local' },
    { name: 'Ana Martínez', email: 'ana@demo.com', role: 'MEMBER', municipality: 'Santa Brígida' },
    { name: 'Pedro Hernández', email: 'pedro@demo.com', role: 'BUSINESS', municipality: 'Arucas', businessName: 'BikeCanarias', businessDescription: 'Tienda de bicicletas y reparaciones. Compra, venta y alquiler de bicis' },
    { name: 'Laura López', email: 'laura@demo.com', role: 'MEMBER', municipality: 'Gáldar' },
    { name: 'Restaurante El Nispero', email: 'nispero@demo.com', role: 'BUSINESS', municipality: 'Valleseco', businessName: 'Restaurante El Nispero', businessDescription: 'Cocina canaria tradicional con productos Km 0 de nuestra huerta' },
    { name: 'David Torres', email: 'david@demo.com', role: 'ADMIN', municipality: 'Las Palmas de Gran Canaria', bio: 'Administrador de Gran Canaria Conecta' },
    { name: 'Isabel Castro', email: 'isabel@demo.com', role: 'MEMBER', municipality: 'Agüimes' },
    { name: 'Tienda Verde', email: 'tiendaverde@demo.com', role: 'BUSINESS', municipality: 'Las Palmas de Gran Canaria', businessName: 'Tienda Verde GC', businessDescription: 'Productos ecológicos, sin plástico y de comercio justo' },
    { name: 'Fernando Santana', email: 'fernando@demo.com', role: 'MEMBER', municipality: 'San Bartolomé de Tirajana' },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: {
        ...user,
        isVerified: user.role === 'BUSINESS',
        avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
      },
    });
  }

  console.log(`✅ ${users.length} users seeded`);
}

async function seedListings() {
  console.log('📋 Seeding listings...');

  const listings = [
    // Economy Circular - Free
    {
      titleEs: 'Sofá de 3 plazas en muy buen estado',
      titleEn: '3-seater sofa in very good condition',
      descEs: 'Regalo sofá de 3 plazas color gris, tela en perfecto estado. Solo por recogida en Las Canteras. Medidas: 200x90x85cm.',
      descEn: 'Giving away a 3-seater grey fabric sofa in perfect condition. Pick up only at Las Canteras. Dimensions: 200x90x85cm.',
      categorySlug: 'regalo-intercambio',
      userEmail: 'maria@demo.com',
      municipality: 'Las Palmas de Gran Canaria',
      location: 'Las Canteras',
      tier: 'FREE',
      metadata: { condition: 'usado' },
      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop'],
      viewCount: 234,
    },
    {
      titleEs: 'Mesa de madera maciza de pino reciclado',
      titleEn: 'Solid recycled pine wood table',
      descEs: 'Mesa de comedor de pino reciclado, fabricada a mano. 180x90cm. Patas de hierro forjado. Perfecta para terraza o salón rústico.',
      descEn: 'Handmade recycled pine dining table. 180x90cm. Wrought iron legs. Perfect for terrace or rustic living room.',
      categorySlug: 'muebles-hogar',
      userEmail: 'carlos@demo.com',
      municipality: 'Telde',
      tier: 'VIP',
      metadata: { condition: 'nuevo', dimensions: '180x90x75cm', material: 'Pino reciclado y hierro' },
      images: ['https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&h=400&fit=crop'],
      viewCount: 567,
    },
    {
      titleEs: 'Bicicleta de montaña Specialized Rockhopper',
      titleEn: 'Specialized Rockhopper mountain bike',
      descEs: 'Vendo bicicleta de montaña Specialized Rockhopper 2022, tamaño M. Mantenimiento al día, frenos de disco hidráulicos. Ideal para rutas de Gran Canaria.',
      descEn: 'Selling Specialized Rockhopper 2022 mountain bike, size M. Up to date maintenance, hydraulic disc brakes. Ideal for Gran Canaria trails.',
      categorySlug: 'bicicletas',
      userEmail: 'pedro@demo.com',
      municipality: 'Arucas',
      location: 'Centro',
      tier: 'HIGHLIGHTED',
      metadata: { condition: 'usado', type: 'montaña', size: 'M' },
      images: ['https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=600&h=400&fit=crop'],
      viewCount: 892,
    },
    {
      titleEs: 'Colección de libros de medio ambiente',
      titleEn: 'Environment book collection',
      descEs: 'Regalo 12 libros sobre sostenibilidad, cambio climático y ecología. Títulos en español e inglés. Perfectos para estudiantes o apasionados del medio ambiente.',
      descEn: 'Giving away 12 books on sustainability, climate change and ecology. Spanish and English titles. Perfect for students or nature enthusiasts.',
      categorySlug: 'libros',
      userEmail: 'isabel@demo.com',
      municipality: 'Agüimes',
      tier: 'FREE',
      metadata: { condition: 'usado', genre: 'Ciencia / Medio Ambiente' },
      images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop'],
      viewCount: 156,
    },
    {
      titleEs: 'Kit de jardinería urbana completo',
      titleEn: 'Complete urban gardening kit',
      descEs: 'Kit completo para empezar tu huerto urbano: macetas de material reciclado, tierra ecológica, semillas variadas (tomate, lechuga, hierbas) y manual de iniciación.',
      descEn: 'Complete kit to start your urban garden: recycled material pots, organic soil, assorted seeds (tomato, lettuce, herbs) and beginner guide.',
      categorySlug: 'materiales-construccion',
      userEmail: 'laura@demo.com',
      municipality: 'Gáldar',
      tier: 'FREE',
      metadata: { condition: 'nuevo', quantity: '1 kit completo' },
      images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop'],
      viewCount: 445,
    },
    {
      titleEs: 'Ropa de bebé 0-2 años (bolsa completa)',
      titleEn: 'Baby clothes 0-2 years (full bag)',
      descEs: 'Bolsa completa con ropa de bebé para niño/a de 0 a 2 años. Body, pijamas, camisetas, pantalones, abrigos. Todo en buen estado, lavado.',
      descEn: 'Full bag of baby clothes for boy/girl 0-2 years. Bodysuits, pajamas, t-shirts, pants, jackets. All in good condition, washed.',
      categorySlug: 'ropa-accesorios',
      userEmail: 'ana@demo.com',
      municipality: 'Santa Brígida',
      tier: 'FREE',
      metadata: { condition: 'usado', size: '0-2 años' },
      images: ['https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&h=400&fit=crop'],
      viewCount: 321,
    },

    // Housing
    {
      titleEs: 'Habitación luminosa con balcón en Vegueta',
      titleEn: 'Bright room with balcony in Vegueta',
      descEs: 'Alquilo habitación exterior con balcón en el casco histórico de Vegueta. Amueblada, wifi, cocina compartida. Ideal para estudiantes o profesionales. 400€/mes + gastos.',
      descEn: 'Renting exterior room with balcony in the historic district of Vegueta. Furnished, wifi, shared kitchen. Ideal for students or professionals. €400/month + expenses.',
      categorySlug: 'vivienda-alquiler',
      userEmail: 'maria@demo.com',
      municipality: 'Las Palmas de Gran Canaria',
      location: 'Vegueta',
      tier: 'HIGHLIGHTED',
      metadata: { type: 'habitación', bedrooms: 1, bathrooms: 1, area: 18, furnished: true, pets: false, longTerm: true },
      images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop'],
      viewCount: 1205,
    },
    {
      titleEs: 'Chalet con vistas al mar en Maspalomas',
      titleEn: 'Sea view villa in Maspalomas',
      descEs: 'Vendo precioso chalet de 3 plantas con vistas panorámicas al mar en Maspalomas. 4 habitaciones, 3 baños, piscina privada, jardín tropical. Garaje para 2 coches.',
      descEn: 'Selling beautiful 3-story villa with panoramic sea views in Maspalomas. 4 bedrooms, 3 bathrooms, private pool, tropical garden. Garage for 2 cars.',
      categorySlug: 'vivienda-venta',
      userEmail: 'fernando@demo.com',
      municipality: 'San Bartolomé de Tirajana',
      location: 'Maspalomas',
      tier: 'VIP',
      metadata: { type: 'chalet', bedrooms: 4, bathrooms: 3, area: 280, pool: true, garden: true, parking: true },
      images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop'],
      viewCount: 3456,
    },

    // Business (PAID)
    {
      titleEs: 'EcoMadera GC - Muebles de madera reciclada',
      titleEn: 'EcoMadera GC - Recycled wood furniture',
      descEs: 'Fabricamos muebles únicos con madera recuperada y de demoliciones. Mesas, estanterías, aparadores y encargos especiales. Cada pieza es única. Visita nuestro taller en Telde.',
      descEn: 'We craft unique furniture from reclaimed and demolition wood. Tables, shelves, sideboards and custom orders. Each piece is unique. Visit our workshop in Telde.',
      categorySlug: 'negocios-servicios',
      userEmail: 'carlos@demo.com',
      municipality: 'Telde',
      location: 'Polígono Industrial, Nave 12',
      tier: 'BUSINESS',
      metadata: { specialty: 'Carpintería ecológica', phone: '+34 612 345 678', hours: 'L-V 8:00-18:00, S 9:00-13:00', certified: true },
      images: ['https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=600&h=400&fit=crop'],
      viewCount: 2340,
    },
    {
      titleEs: 'Restaurante El Nispero - Cocina canaria Km 0',
      titleEn: 'Restaurant El Nispero - Km 0 Canarian cuisine',
      descEs: 'Disfruta de la auténtica cocina canaria elaborada con productos de nuestra huerta y proveedores locales. Sancocho, ropa vieja, papas arrugadas y postres caseros. Terraza con vistas al barranco.',
      descEn: 'Enjoy authentic Canarian cuisine made with produce from our garden and local suppliers. Sancocho, ropa vieja, wrinkled potatoes and homemade desserts. Terrace with valley views.',
      categorySlug: 'restaurantes-catering',
      userEmail: 'nispero@demo.com',
      municipality: 'Valleseco',
      tier: 'BUSINESS',
      metadata: { cuisine: 'Canaria tradicional', phone: '+34 928 678 123', hours: 'M-D 12:00-22:00', delivery: false, terrace: true, isEco: true },
      images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop'],
      viewCount: 4567,
    },
    {
      titleEs: 'BikeCanarias - Venta, alquiler y reparación de bicis',
      titleEn: 'BikeCanarias - Bike sales, rental and repair',
      descEs: 'Tu tienda de bicicletas en Arucas. Amplio stock de MTB, carretera y urbanas. Servicio técnico profesional. Alquiler por horas o días. ¡Descubre Gran Canaria en bici!',
      descEn: 'Your bike shop in Arucas. Wide stock of MTB, road and urban bikes. Professional technical service. Hourly or daily rental. Discover Gran Canaria by bike!',
      categorySlug: 'bicicletas',
      userEmail: 'pedro@demo.com',
      municipality: 'Arucas',
      tier: 'BUSINESS',
      metadata: { phone: '+34 928 123 456', hours: 'L-V 9:00-19:00, S 10:00-14:00' },
      images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&h=400&fit=crop'],
      viewCount: 1890,
    },
    {
      titleEs: 'Tienda Verde GC - Productos ecológicos a granel',
      titleEn: 'Tienda Verde GC - Bulk eco products',
      descEs: 'Tu tienda de confianza para una vida sin plástico. Productos ecológicos, a granel, de comercio justo y de proximidad. Detergentes, alimentos, cosmética y mucho más.',
      descEn: 'Your trusted store for a plastic-free life. Organic, bulk, fair trade and local products. Detergents, food, cosmetics and much more.',
      categorySlug: 'agricultura-local',
      userEmail: 'tiendaverde@demo.com',
      municipality: 'Las Palmas de Gran Canaria',
      location: 'Calle León y Castillo, 47',
      tier: 'BUSINESS',
      metadata: { products: 'Alimentos a granel, cosmética, limpieza', organic: true, phone: '+34 928 456 789', hours: 'L-S 9:30-20:00', delivery: true },
      images: ['https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=400&fit=crop'],
      viewCount: 3120,
    },

    // Jobs
    {
      titleEs: 'Se busca monitor/a de actividades medioambientales',
      titleEn: 'Environmental activities instructor wanted',
      descEs: 'Buscamos monitor/a para talleres de educación ambiental en escuelas de Gran Canaria. Contrato temporal junio-septiembre. Requiere experiencia con niños y conocimiento del medio natural canario.',
      descEn: 'Looking for an instructor for environmental education workshops in Gran Canaria schools. Temporary contract June-September. Experience with children and knowledge of the Canarian natural environment required.',
      categorySlug: 'empleo',
      userEmail: 'david@demo.com',
      municipality: 'Las Palmas de Gran Canaria',
      tier: 'FREE',
      metadata: { jobType: 'temporal', sector: 'Educación ambiental', experience: 'medio', remote: false },
      viewCount: 678,
    },

    // Community
    {
      titleEs: 'Adopción responsable: gatitos encontrados en Teror',
      titleEn: 'Responsible adoption: kittens found in Teror',
      descEs: 'Encontramos una camada de 4 gatitos de aproximadamente 2 meses en Teror. Están sanos, desparasitados y muy cariñosos. Buscamos hogares responsables con compromiso de esterilización.',
      descEn: 'We found a litter of 4 kittens approximately 2 months old in Teror. They are healthy, dewormed and very affectionate. Looking for responsible homes committed to spaying/neutering.',
      categorySlug: 'mascotas',
      userEmail: 'laura@demo.com',
      municipality: 'Teror',
      tier: 'FREE',
      metadata: { animalType: 'gato', listingType: 'adopción', age: '2 meses' },
      images: ['https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=400&fit=crop'],
      viewCount: 1890,
    },
    {
      titleEs: 'Se perdió golden retriever en Las Canteras',
      titleEn: 'Lost golden retriever in Las Canteras',
      descEs: 'Se ha perdido mi golden retriever, hembra, llamada Luna. Tiene chip y collar azul. Se perdió el 15 de mayo por la mañana en la zona de Las Canteras, cerca del Paseo. Por favor, si la ves, contacta conmigo.',
      descEn: 'My golden retriever named Luna has gone missing. She has a microchip and blue collar. Lost on May 15th morning in the Las Canteras area, near the Paseo. Please contact me if you see her.',
      categorySlug: 'perdidos-encontrados',
      userEmail: 'ana@demo.com',
      municipality: 'Las Palmas de Gran Canaria',
      location: 'Playa de Las Canteras',
      tier: 'FREE',
      metadata: { listingType: 'se perdió', date: '2025-05-15' },
      images: ['https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=600&h=400&fit=crop'],
      viewCount: 2340,
    },

    // Electronics
    {
      titleEs: 'Portátil Lenovo ThinkPad reacondicionado',
      titleEn: 'Refurbished Lenovo ThinkPad laptop',
      descEs: 'Lenovo ThinkPad T480 reacondicionado. Intel i5 8th gen, 16GB RAM, 256GB SSD. Batería con 85% de salud. Perfecto para trabajo y estudios. Incluye cargador.',
      descEn: 'Refurbished Lenovo ThinkPad T480. Intel i5 8th gen, 16GB RAM, 256GB SSD. Battery at 85% health. Perfect for work and studies. Charger included.',
      categorySlug: 'electronica',
      userEmail: 'fernando@demo.com',
      municipality: 'San Bartolomé de Tirajana',
      tier: 'HIGHLIGHTED',
      metadata: { condition: 'reacondicionado', brand: 'Lenovo' },
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop'],
      viewCount: 1567,
    },
  ];

  for (const item of listings) {
    const user = await prisma.user.findUnique({ where: { email: item.userEmail } });
    const category = await prisma.category.findUnique({ where: { slug: item.categorySlug } });
    if (!user || !category) continue;

    const title = item.tier === 'FREE' ? item.titleEs : `${item.titleEs} (ES) / ${item.titleEn} (EN)`;
    const desc = `${item.descEs}\n\n---\n\n${item.descEn}`;

    await prisma.listing.upsert({
      where: { slug: slugify(item.titleEs) },
      update: {},
      create: {
        slug: slugify(item.titleEs),
        title,
        description: desc,
        categoryId: category.id,
        authorId: user.id,
        tier: item.tier,
        metadata: JSON.stringify(item.metadata),
        images: JSON.stringify(item.images || []),
        municipality: item.municipality,
        location: item.location,
        status: 'ACTIVE',
        publishedAt: new Date(),
        viewCount: item.viewCount || 0,
        showPhone: item.tier === 'BUSINESS',
        showEmail: true,
        contactMethod: 'message',
        expiresAt: new Date(Date.now() + category.expiryDays * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`✅ ${listings.length} listings seeded`);
}

async function seedEvents() {
  console.log('📅 Seeding events...');

  const events = [
    {
      title: 'Limpieza solidaria de Playa de Las Canteras',
      descEs: 'Únete a nuestra limpieza solidaria mensual de la Playa de Las Canteras. Proporcionamos guantes, bolsas y pinzas. Trae calzado cómodo, protector solar y ganas de ayudar. Al final, merienda compartida para todos los participantes.',
      descEn: 'Join our monthly solidarity cleanup of Las Canteras Beach. We provide gloves, bags and grabbers. Bring comfortable shoes, sunscreen and a willingness to help. Afterwards, a shared snack for all participants.',
      userEmail: 'maria@demo.com',
      municipality: 'Las Palmas de Gran Canaria',
      location: 'Playa de Las Canteras - Punto de encuentro: Auditorio',
      category: 'CLEANUP',
      startDate: '2025-06-14T09:00:00',
      endDate: '2025-06-14T13:00:00',
      isFree: true,
      isEco: true,
      ecoTags: ['zero-waste', 'recycling', 'beach-cleanup'],
      capacity: 100,
      image: 'https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=600&h=400&fit=crop',
    },
    {
      title: 'Taller de Compostaje Doméstico',
      descEs: 'Aprende a convertir tus residuos orgánicos en abono natural. Taller práctico de 3 horas donde verás todo el proceso y te llevarás tu propio compostador casero. Impartido por agrónomos del Cabildo de Gran Canaria.',
      descEn: 'Learn to convert your organic waste into natural fertilizer. 3-hour practical workshop where you will see the entire process and take home your own homemade composter. Taught by agronomists from the Cabildo de Gran Canaria.',
      userEmail: 'isabel@demo.com',
      municipality: 'Telde',
      location: 'Centro de Educación Ambiental de Telde',
      category: 'WORKSHOP',
      startDate: '2025-06-21T10:00:00',
      endDate: '2025-06-21T13:00:00',
      isFree: true,
      isEco: true,
      ecoTags: ['composting', 'organic', 'sustainable'],
      capacity: 30,
      price: 0,
      image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&h=400&fit=crop',
    },
    {
      title: 'Mercado Agrícola y Artesanal de Santa Brígida',
      descEs: 'El mercado agrícola más antiguo de Gran Canaria. Productos locales de temporada, artesanía canaria, música en vivo y actividades para niños. Ven a disfrutar de la auténtica vida local.',
      descEn: 'The oldest agricultural market in Gran Canaria. Seasonal local products, Canarian crafts, live music and children activities. Come and enjoy authentic local life.',
      userEmail: 'ana@demo.com',
      municipality: 'Santa Brígida',
      location: 'Plaza de la Alameda, Santa Brígida',
      category: 'MARKET',
      startDate: '2025-06-07T08:00:00',
      endDate: '2025-06-07T14:00:00',
      isFree: true,
      isEco: true,
      ecoTags: ['local-products', 'organic', 'km0'],
      image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop',
    },
    {
      title: 'Ruta senderista: Caldera de Bandama',
      descEs: 'Ruta guiada por la Caldera de Bandama con explicaciones geológicas y botánicas. Nivel medio, 4km ida y vuelta. Lleva agua, calzado de montaña y protección solar. Recuerda: no dejes rastro.',
      descEn: 'Guided hike through the Caldera de Bandama with geological and botanical explanations. Medium level, 4km round trip. Bring water, hiking shoes and sun protection. Remember: leave no trace.',
      userEmail: 'fernando@demo.com',
      municipality: 'Santa Brígida',
      location: 'Mirador de la Caldera de Bandama',
      category: 'SPORT',
      startDate: '2025-06-28T08:30:00',
      endDate: '2025-06-28T12:30:00',
      isFree: true,
      isEco: true,
      ecoTags: ['hiking', 'nature', 'leave-no-trace'],
      capacity: 25,
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop',
    },
    {
      title: 'Concierto Acústico: Música del Mundo',
      descEs: 'Concierto benéfico de música del mundo con artistas locales. Todos los fondos van a proyectos de reforestación en Gran Canaria. Entrada libre con donación voluntaria.',
      descEn: 'Benefit world music concert with local artists. All proceeds go to reforestation projects in Gran Canaria. Free entry with voluntary donation.',
      userEmail: 'david@demo.com',
      municipality: 'Gáldar',
      location: 'Plaza de Santiago, Gáldar',
      category: 'CONCERT',
      startDate: '2025-07-05T20:00:00',
      endDate: '2025-07-05T23:00:00',
      isFree: true,
      isEco: true,
      ecoTags: ['reforestation', 'community'],
      capacity: 200,
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
    },
    {
      title: 'Taller de Reparación: Arregla tu bici',
      descEs: 'Taller gratuito de reparación de bicicletas. Aprende a cambiar una rueda, ajustar frenos y mantener tu bici en perfecto estado. Trae tu bici y las herramientas básicas. Monitorizado por mecánicos profesionales.',
      descEn: 'Free bicycle repair workshop. Learn to change a wheel, adjust brakes and keep your bike in perfect condition. Bring your bike and basic tools. Supervised by professional mechanics.',
      userEmail: 'pedro@demo.com',
      municipality: 'Arucas',
      location: 'Plaza de Arucas',
      category: 'WORKSHOP',
      startDate: '2025-06-15T10:00:00',
      endDate: '2025-06-15T13:00:00',
      isFree: true,
      isEco: true,
      ecoTags: ['cycling', 'repair', 'sustainable-mobility'],
      capacity: 20,
      image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=600&h=400&fit=crop',
    },
  ];

  for (const evt of events) {
    const user = await prisma.user.findUnique({ where: { email: evt.userEmail } });
    if (!user) continue;

    const desc = `${evt.descEs}\n\n---\n\n${evt.descEn}`;

    await prisma.event.upsert({
      where: { slug: slugify(evt.title) },
      update: {},
      create: {
        slug: slugify(evt.title),
        title: evt.title,
        description: desc,
        authorId: user.id,
        startDate: new Date(evt.startDate),
        endDate: evt.endDate ? new Date(evt.endDate) : null,
        location: evt.location,
        municipality: evt.municipality,
        image: evt.image,
        category: evt.category,
        isFree: evt.isFree,
        price: evt.price,
        capacity: evt.capacity,
        isEco: evt.isEco,
        ecoTags: JSON.stringify(evt.ecoTags || []),
        status: 'UPCOMING',
        organizer: user.name,
      },
    });
  }

  console.log(`✅ ${events.length} events seeded`);
}

async function seedArticles() {
  console.log('📰 Seeding articles...');

  const articles = [
    {
      titleEs: 'Gran Canaria lidera la reducción de plásticos de un solo uso',
      titleEn: 'Gran Canaria leads single-use plastic reduction',
      excerptEs: 'La isla ha reducido un 40% el consumo de plásticos en el último año gracias a iniciativas comunitarias y nuevas ordenanzas municipales.',
      excerptEn: 'The island has reduced plastic consumption by 40% in the last year thanks to community initiatives and new municipal ordinances.',
      contentEs: '# Gran Canaria lidera la reducción de plásticos\n\nLa isla ha reducido un 40% el consumo de plásticos de un solo uso en el último año. Iniciativas como los mercados a granel, las tiendas sin plástico y la concienciación ciudadana están marcando la diferencia.\n\nLos municipios de Las Palmas, Telde y Arucas han sido los más activos, implementando ordenanzas que prohíben los plásticos en eventos públicos y mercados municipales.',
      contentEn: '# Gran Canaria leads single-use plastic reduction\n\nThe island has reduced single-use plastic consumption by 40% in the last year. Initiatives like bulk markets, plastic-free stores and citizen awareness are making a difference.\n\nThe municipalities of Las Palmas, Telde and Arucas have been the most active, implementing ordinances that ban plastics in public events and municipal markets.',
      userEmail: 'david@demo.com',
      category: 'ENVIRONMENT',
      image: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&h=400&fit=crop',
      tags: ['plásticos', 'sostenibilidad', 'medio ambiente'],
      viewCount: 3456,
    },
    {
      titleEs: 'Nueva planta solar comunitaria en Agüimes',
      titleEn: 'New community solar plant in Agüimes',
      excerptEs: 'Vecinos de Agüimes impulsan una cooperativa energética que suministrará energía solar a 200 familias a precio reducido.',
      excerptEn: 'Agüimes residents promote an energy cooperative that will supply solar energy to 200 families at a reduced price.',
      contentEs: '# Nueva planta solar comunitaria\n\nEl municipio de Agüimes acogerá una nueva planta solar comunitaria impulsada por una cooperativa de vecinos. El proyecto, con una inversión de 500.000€, podrá suministrar energía limpia a 200 familias del municipio.\n\nLa energía solar es clave para la sostenibilidad de Gran Canaria.',
      contentEn: '# New community solar plant\n\nThe municipality of Agüimes will host a new community solar plant driven by a residents cooperative. The project, with an investment of €500,000, will be able to supply clean energy to 200 families in the municipality.\n\nSolar energy is key to the sustainability of Gran Canaria.',
      userEmail: 'david@demo.com',
      category: 'SUSTAINABILITY',
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=400&fit=crop',
      tags: ['energía solar', 'cooperativa', 'Agüimes'],
      viewCount: 2345,
    },
    {
      titleEs: 'Guía completa de reciclaje en Gran Canaria: Qué va en cada contenedor',
      titleEn: 'Complete recycling guide in Gran Canaria: What goes in each container',
      excerptEs: 'Te explicamos de forma sencilla cómo separar correctamente tus residuos y dónde llevar los materiales que no caben en los contenedores convencionales.',
      excerptEn: 'We explain simply how to correctly separate your waste and where to take materials that do not fit in conventional containers.',
      contentEs: '# Guía de reciclaje\n\n## Contenedores habituales\n\n- 🟡 Amarillo: Envases de plástico, latas y briks\n- 🔵 Azul: Papel y cartón\n- 🟢 Verde: Vidrio\n- ⚫ Gris: Resto de residuos orgánicos\n- 🟤 Marrón: Materia orgánica\n\n## Puntos limpios\n\nPara electrónica, muebles, aceite usado, pinturas y otros residuos especiales, acude a tu punto limpio más cercano.',
      contentEn: '# Recycling guide\n\n## Standard containers\n\n- 🟡 Yellow: Plastic containers, cans and cartons\n- 🔵 Blue: Paper and cardboard\n- 🟢 Green: Glass\n- ⚫ Grey: General waste\n- 🟤 Brown: Organic matter\n\n## Clean points\n\nFor electronics, furniture, used oil, paints and other special waste, go to your nearest clean point.',
      userEmail: 'maria@demo.com',
      category: 'ENVIRONMENT',
      image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&h=400&fit=crop',
      tags: ['reciclaje', 'guía', 'contenedores', 'punto limpio'],
      viewCount: 5678,
    },
    {
      titleEs: '5 negocios locales que están cambiando las reglas del juego',
      titleEn: '5 local businesses that are changing the game',
      excerptEs: 'Conoce los negocios canarios que apuestan por la sostenibilidad y están demostrando que se puede ganar dinero cuidando el planeta.',
      excerptEn: 'Meet the Canarian businesses betting on sustainability and proving you can make money while caring for the planet.',
      contentEs: '# Negocios sostenibles\n\n1. **EcoMadera GC** - Carpintería con madera reciclada\n2. **Restaurante El Nispero** - Cocina Km 0\n3. **Tienda Verde GC** - Sin plástico, a granel\n4. **BikeCanarias** - Movilidad sostenible\n5. **Finca El Roque** - Agricultura ecológica\n\nEstos negocios demuestran que la sostenibilidad y la rentabilidad van de la mano.',
      contentEn: '# Sustainable businesses\n\n1. **EcoMadera GC** - Carpentry with recycled wood\n2. **Restaurant El Nispero** - Km 0 cuisine\n3. **Tienda Verde GC** - Plastic-free, bulk\n4. **BikeCanarias** - Sustainable mobility\n5. **Finca El Roque** - Organic farming\n\nThese businesses show that sustainability and profitability go hand in hand.',
      userEmail: 'david@demo.com',
      category: 'BUSINESS',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
      tags: ['negocios', 'sostenibilidad', 'economía circular'],
      viewCount: 4567,
    },
  ];

  for (const article of articles) {
    const user = await prisma.user.findUnique({ where: { email: article.userEmail } });
    if (!user) continue;

    const content = `<!--:es-->\n${article.contentEs}\n\n<!--:-->\n<!--:en-->\n${article.contentEn}\n\n<!--:-->`;
    const excerpt = article.excerptEs;
    const title = `${article.titleEs}`;

    await prisma.article.upsert({
      where: { slug: slugify(article.titleEs) },
      update: {},
      create: {
        slug: slugify(article.titleEs),
        title,
        content,
        excerpt,
        authorId: user.id,
        category: article.category,
        image: article.image,
        tags: JSON.stringify(article.tags),
        isPublished: true,
        publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        viewCount: article.viewCount,
      },
    });
  }

  console.log(`✅ ${articles.length} articles seeded`);
}

async function seedRecyclingPoints() {
  console.log('♻️ Seeding recycling points...');

  const points = [
    {
      name: 'Ecoparque de Las Palmas',
      desc: 'El principal ecoparque de la ciudad. Amplio horario y acepta todo tipo de residuos especiales.',
      municipality: 'Las Palmas de Gran Canaria',
      address: 'Polígono de El Goro, s/n',
      types: ['electronica', 'mueble', 'neumaticos', 'escombros', 'aceite', 'textil', 'medicamentos', 'baterias'],
      schedule: { mon: '8-18', tue: '8-18', wed: '8-18', thu: '8-18', fri: '8-18', sat: '8-14', sun: '' },
      phone: '+34 928 449 500',
      facilityType: 'ecoparque' as const,
    },
    {
      name: 'Punto Limpio de Telde',
      desc: 'Punto limpio municipal con servicio de recogida de muebles y electrodomésticos.',
      municipality: 'Telde',
      address: 'Ctra. General de Jinámar, km 4',
      types: ['electronica', 'mueble', 'neumaticos', 'aceite', 'textil', 'baterias'],
      schedule: { mon: '8-17', tue: '8-17', wed: '8-17', thu: '8-17', fri: '8-17', sat: '8-13', sun: '' },
      phone: '+34 928 697 000',
      facilityType: 'clean_point' as const,
    },
    {
      name: 'Punto Limpio de Arucas',
      desc: 'Centro de reciclaje del norte de la isla. Amplio catálogo de residuos aceptados.',
      municipality: 'Arucas',
      address: 'Polígono Industrial de Arucas',
      types: ['electronica', 'mueble', 'escombros', 'aceite', 'baterias', 'medicamentos'],
      schedule: { mon: '8-17', tue: '8-17', wed: '8-17', thu: '8-17', fri: '8-17', sat: '8-14', sun: '' },
      phone: '+34 928 603 000',
      facilityType: 'clean_point' as const,
    },
    {
      name: 'Centro de Reciclaje de Gáldar',
      desc: 'Instalaciones modernas con separación de residuos y tienda de segunda mano.',
      municipality: 'Gáldar',
      address: 'Camino de Los Padrones, s/n',
      types: ['plastico', 'vidrio', 'papel', 'organico', 'electronica', 'textil'],
      schedule: { mon: '8-17', tue: '8-17', wed: '8-17', thu: '8-17', fri: '8-17', sat: '8-13', sun: '' },
      facilityType: 'ecoparque' as const,
    },
    {
      name: 'Contenedores Subterráneos de Santa Brígida',
      desc: 'Sistema innovador de contenedores subterráneos para residuos urbanos.',
      municipality: 'Santa Brígida',
      address: 'Plaza de la Alameda',
      types: ['plastico', 'vidrio', 'papel', 'organico'],
      schedule: { mon: '24h', tue: '24h', wed: '24h', thu: '24h', fri: '24h', sat: '24h', sun: '24h' },
      facilityType: 'container' as const,
    },
    {
      name: 'Recogida de Textil - Agüimes',
      desc: 'Contenedores específicos para ropa y textiles. Recogida gestionada por Cáritas.',
      municipality: 'Agüimes',
      address: 'Calle Los Moriscos, junto al mercado',
      types: ['textil'],
      schedule: { mon: '24h', tue: '24h', wed: '24h', thu: '24h', fri: '24h', sat: '24h', sun: '24h' },
      facilityType: 'specialized' as const,
    },
  ];

  for (const point of points) {
    await prisma.recyclingPoint.upsert({
      where: { id: `rp-${slugify(point.name)}` },
      update: {},
      create: {
        id: `rp-${slugify(point.name)}`,
        name: point.name,
        description: point.desc,
        municipality: point.municipality,
        address: point.address,
        types: JSON.stringify(point.types),
        schedule: JSON.stringify(point.schedule),
        phone: point.phone,
        facilityType: point.facilityType,
      },
    });
  }

  console.log(`✅ ${points.length} recycling points seeded`);
}

async function seedStats() {
  console.log('📊 Seeding community stats...');

  for (const stat of DEMO_STATS) {
    await prisma.communityStat.upsert({
      where: { statKey: stat.statKey },
      update: { statValue: stat.statValue },
      create: {
        statKey: stat.statKey,
        statValue: stat.statValue,
        statLabel: stat.statLabelEs,
      },
    });
  }

  console.log(`✅ ${DEMO_STATS.length} stats seeded`);
}

// ── MAIN ────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('🏝️  GRAN CANARIA CONECTA - Database Seeding');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  try {
    await seedCategories();
    await seedUsers();
    await seedListings();
    await seedEvents();
    await seedArticles();
    await seedRecyclingPoints();
    await seedStats();

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All seeds completed successfully!');
    console.log('');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

import 'dotenv/config';
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { account, user } from './auth-schema';
import { categories, ingredients, products } from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// ─── Dados ────────────────────────────────────────────────────────────────────

const USERS = [
  { name: 'Admin Kafe', email: 'admin@kafe.com', password: 'admin123', role: 'ADMIN' },
  { name: 'Barista Silva', email: 'barista@kafe.com', password: 'barista123', role: 'BARISTA' },
  { name: 'Cliente Teste', email: 'cliente@kafe.com', password: 'cliente123', role: 'CLIENT' },
];

const CATEGORIES = [
  { name: 'Cafés', description: 'Bebidas à base de café', sortOrder: 1 },
  { name: 'Bebidas Frias', description: 'Sucos, smoothies e drinks gelados', sortOrder: 2 },
  { name: 'Doces', description: 'Bolos, tortas e sobremesas', sortOrder: 3 },
  { name: 'Salgados', description: 'Lanches e petiscos', sortOrder: 4 },
];

const INGREDIENTS = [
  { name: 'Café moído', unit: 'g', currentStock: '2000', minimumStock: '500' },
  { name: 'Leite integral', unit: 'ml', currentStock: '5000', minimumStock: '1000' },
  { name: 'Açúcar', unit: 'g', currentStock: '3000', minimumStock: '500' },
  { name: 'Creme de leite', unit: 'ml', currentStock: '1000', minimumStock: '200' },
  { name: 'Chocolate em pó', unit: 'g', currentStock: '1500', minimumStock: '300' },
  { name: 'Farinha de trigo', unit: 'g', currentStock: '4000', minimumStock: '1000' },
  { name: 'Ovos', unit: 'un', currentStock: '30', minimumStock: '10' },
  { name: 'Manteiga', unit: 'g', currentStock: '500', minimumStock: '100' },
];

const PRODUCTS_BY_CATEGORY: Record<string, { name: string; description: string; price: string }[]> =
  {
    Cafés: [
      { name: 'Espresso', description: 'Café curto intenso extraído sob pressão', price: '6.00' },
      { name: 'Cappuccino', description: 'Espresso com leite vaporizado e espuma', price: '12.00' },
      { name: 'Latte', description: 'Espresso com bastante leite vaporizado', price: '14.00' },
      { name: 'Mocha', description: 'Espresso com chocolate e leite vaporizado', price: '16.00' },
    ],
    'Bebidas Frias': [
      { name: 'Iced Coffee', description: 'Café gelado com gelo', price: '12.00' },
      { name: 'Frappuccino', description: 'Café batido com gelo e chantilly', price: '18.00' },
    ],
    Doces: [
      { name: 'Brownie', description: 'Brownie de chocolate com nozes', price: '10.00' },
      { name: 'Cheesecake', description: 'Cheesecake de frutas vermelhas', price: '14.00' },
    ],
    Salgados: [
      { name: 'Croissant', description: 'Croissant de manteiga folhado', price: '9.00' },
      { name: 'Pão de Queijo', description: 'Pão de queijo mineiro artesanal', price: '6.00' },
    ],
  };

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Iniciando seed...\n');

  // Usuários
  console.log('👤 Criando usuários...');
  for (const u of USERS) {
    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, u.email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`   ⚠️  ${u.email} já existe, pulando...`);
      continue;
    }

    const id = crypto.randomUUID();
    const hashedPwd = await hashPassword(u.password);
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.insert(user).values({
        id,
        name: u.name,
        email: u.email,
        emailVerified: false,
        role: u.role,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(account).values({
        id: crypto.randomUUID(),
        accountId: id,
        providerId: 'credential',
        userId: id,
        password: hashedPwd,
        createdAt: now,
        updatedAt: now,
      });
    });

    console.log(`   ✅ ${u.role.padEnd(7)} | ${u.email} | senha: ${u.password}`);
  }

  // Categorias
  console.log('\n📂 Criando categorias...');
  const insertedCategories: { id: string; name: string }[] = [];

  for (const cat of CATEGORIES) {
    const [inserted] = await db
      .insert(categories)
      .values(cat)
      .onConflictDoNothing()
      .returning({ id: categories.id, name: categories.name });

    if (inserted) {
      insertedCategories.push(inserted);
      console.log(`   ✅ ${cat.name}`);
    } else {
      const [existing] = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(eq(categories.name, cat.name))
        .limit(1);
      if (existing) insertedCategories.push(existing);
      console.log(`   ⚠️  ${cat.name} já existe, pulando...`);
    }
  }

  // Ingredientes
  console.log('\n🧂 Criando ingredientes...');
  for (const ing of INGREDIENTS) {
    await db.insert(ingredients).values(ing).onConflictDoNothing();
    console.log(`   ✅ ${ing.name}`);
  }

  // Produtos
  console.log('\n☕ Criando produtos...');
  for (const cat of insertedCategories) {
    const prods = PRODUCTS_BY_CATEGORY[cat.name] ?? [];
    for (const prod of prods) {
      await db
        .insert(products)
        .values({ ...prod, categoryId: cat.id })
        .onConflictDoNothing();
      console.log(`   ✅ [${cat.name}] ${prod.name} — R$ ${prod.price}`);
    }
  }

  console.log('\n✅ Seed concluído!\n');
  console.log('─'.repeat(52));
  console.log('Credenciais para login:');
  console.log('─'.repeat(52));
  for (const u of USERS) {
    console.log(`  ${u.role.padEnd(7)} → ${u.email.padEnd(22)} / ${u.password}`);
  }
  console.log('─'.repeat(52));
  console.log('\nEndpoint: POST /api/auth/sign-in/email');
  console.log('Body:     { "email": "...", "password": "..." }\n');
}

seed()
  .catch((err) => {
    console.error('❌ Erro no seed:', err);
    process.exit(1);
  })
  .finally(() => pool.end());

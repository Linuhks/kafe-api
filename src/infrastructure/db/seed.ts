import 'dotenv/config';
import { hashPassword } from 'better-auth/crypto';
import { count, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { account, user } from './auth-schema';
import {
  categories,
  ingredients,
  inventoryMovements,
  orderItems,
  orders,
  productIngredients,
  products,
} from './schema';

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
  { name: 'Calda de baunilha', unit: 'ml', currentStock: '800', minimumStock: '150' },
  { name: 'Chantilly', unit: 'ml', currentStock: '600', minimumStock: '100' },
  { name: 'Queijo minas', unit: 'g', currentStock: '1200', minimumStock: '300' },
  { name: 'Presunto', unit: 'g', currentStock: '800', minimumStock: '200' },
  { name: 'Cream cheese', unit: 'g', currentStock: '400', minimumStock: '100' },
  { name: 'Biscoito maisena', unit: 'g', currentStock: '500', minimumStock: '100' },
  { name: 'Cacau em pó', unit: 'g', currentStock: '600', minimumStock: '150' },
];

const PRODUCTS_BY_CATEGORY: Record<string, { name: string; description: string; price: string }[]> =
  {
    Cafés: [
      { name: 'Espresso', description: 'Café curto intenso extraído sob pressão', price: '6.00' },
      { name: 'Cappuccino', description: 'Espresso com leite vaporizado e espuma', price: '12.00' },
      { name: 'Latte', description: 'Espresso com bastante leite vaporizado', price: '14.00' },
      { name: 'Mocha', description: 'Espresso com chocolate e leite vaporizado', price: '16.00' },
      { name: 'Americano', description: 'Espresso diluído em água quente', price: '8.00' },
      { name: 'Cold Brew', description: 'Café extraído a frio por 12 horas', price: '15.00' },
      { name: 'Macchiato', description: 'Espresso marcado com espuma de leite', price: '10.00' },
    ],
    'Bebidas Frias': [
      { name: 'Iced Coffee', description: 'Café gelado com gelo', price: '12.00' },
      { name: 'Frappuccino', description: 'Café batido com gelo e chantilly', price: '18.00' },
      { name: 'Iced Latte', description: 'Latte gelado com gelo', price: '15.00' },
      {
        name: 'Milkshake de Café',
        description: 'Sorvete de baunilha batido com café',
        price: '20.00',
      },
    ],
    Doces: [
      { name: 'Brownie', description: 'Brownie de chocolate com nozes', price: '10.00' },
      { name: 'Cheesecake', description: 'Cheesecake de frutas vermelhas', price: '14.00' },
      { name: 'Tiramisu', description: 'Tiramisu clássico com mascarpone e café', price: '16.00' },
      {
        name: 'Bolo de Chocolate',
        description: 'Fatia de bolo de chocolate com cobertura',
        price: '12.00',
      },
    ],
    Salgados: [
      { name: 'Croissant', description: 'Croissant de manteiga folhado', price: '9.00' },
      { name: 'Pão de Queijo', description: 'Pão de queijo mineiro artesanal', price: '6.00' },
      { name: 'Coxinha', description: 'Coxinha crocante de frango com catupiry', price: '8.00' },
      {
        name: 'Misto Quente',
        description: 'Sanduíche de presunto e queijo grelhado',
        price: '12.00',
      },
    ],
  };

// Ingredientes por produto: { nomeProduto: [{ nomeIngrediente, quantidade }] }
const PRODUCT_INGREDIENTS: Record<string, { ingredient: string; quantity: string }[]> = {
  Espresso: [{ ingredient: 'Café moído', quantity: '7' }],
  Cappuccino: [
    { ingredient: 'Café moído', quantity: '7' },
    { ingredient: 'Leite integral', quantity: '150' },
  ],
  Latte: [
    { ingredient: 'Café moído', quantity: '7' },
    { ingredient: 'Leite integral', quantity: '250' },
  ],
  Mocha: [
    { ingredient: 'Café moído', quantity: '7' },
    { ingredient: 'Leite integral', quantity: '200' },
    { ingredient: 'Chocolate em pó', quantity: '15' },
  ],
  Americano: [{ ingredient: 'Café moído', quantity: '14' }],
  'Cold Brew': [{ ingredient: 'Café moído', quantity: '30' }],
  Macchiato: [
    { ingredient: 'Café moído', quantity: '7' },
    { ingredient: 'Leite integral', quantity: '30' },
  ],
  'Iced Coffee': [
    { ingredient: 'Café moído', quantity: '14' },
    { ingredient: 'Açúcar', quantity: '10' },
  ],
  Frappuccino: [
    { ingredient: 'Café moído', quantity: '14' },
    { ingredient: 'Leite integral', quantity: '150' },
    { ingredient: 'Chantilly', quantity: '50' },
  ],
  'Iced Latte': [
    { ingredient: 'Café moído', quantity: '7' },
    { ingredient: 'Leite integral', quantity: '250' },
  ],
  'Milkshake de Café': [
    { ingredient: 'Café moído', quantity: '10' },
    { ingredient: 'Leite integral', quantity: '200' },
    { ingredient: 'Calda de baunilha', quantity: '20' },
  ],
  Brownie: [
    { ingredient: 'Farinha de trigo', quantity: '80' },
    { ingredient: 'Ovos', quantity: '2' },
    { ingredient: 'Manteiga', quantity: '60' },
    { ingredient: 'Chocolate em pó', quantity: '30' },
    { ingredient: 'Açúcar', quantity: '100' },
  ],
  Cheesecake: [
    { ingredient: 'Cream cheese', quantity: '150' },
    { ingredient: 'Ovos', quantity: '2' },
    { ingredient: 'Açúcar', quantity: '80' },
    { ingredient: 'Biscoito maisena', quantity: '100' },
    { ingredient: 'Manteiga', quantity: '40' },
  ],
  Tiramisu: [
    { ingredient: 'Café moído', quantity: '20' },
    { ingredient: 'Cream cheese', quantity: '100' },
    { ingredient: 'Ovos', quantity: '2' },
    { ingredient: 'Açúcar', quantity: '60' },
    { ingredient: 'Cacau em pó', quantity: '10' },
  ],
  'Bolo de Chocolate': [
    { ingredient: 'Farinha de trigo', quantity: '100' },
    { ingredient: 'Ovos', quantity: '2' },
    { ingredient: 'Manteiga', quantity: '80' },
    { ingredient: 'Chocolate em pó', quantity: '40' },
    { ingredient: 'Açúcar', quantity: '120' },
  ],
  Croissant: [
    { ingredient: 'Farinha de trigo', quantity: '100' },
    { ingredient: 'Manteiga', quantity: '60' },
  ],
  'Pão de Queijo': [
    { ingredient: 'Queijo minas', quantity: '50' },
    { ingredient: 'Ovos', quantity: '1' },
    { ingredient: 'Manteiga', quantity: '20' },
  ],
  Coxinha: [
    { ingredient: 'Farinha de trigo', quantity: '80' },
    { ingredient: 'Presunto', quantity: '40' },
    { ingredient: 'Manteiga', quantity: '15' },
  ],
  'Misto Quente': [
    { ingredient: 'Presunto', quantity: '60' },
    { ingredient: 'Queijo minas', quantity: '50' },
    { ingredient: 'Manteiga', quantity: '10' },
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

  // Resolver IDs de client e barista para uso nos pedidos
  const [clientUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, 'cliente@kafe.com'))
    .limit(1);

  const [baristaUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, 'barista@kafe.com'))
    .limit(1);

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

  // Resolver mapa nome→id de ingredientes
  const allIngredients = await db
    .select({ id: ingredients.id, name: ingredients.name })
    .from(ingredients);
  const ingredientByName = Object.fromEntries(allIngredients.map((i) => [i.name, i.id]));

  // Produtos
  console.log('\n☕ Criando produtos...');
  const insertedProducts: { id: string; name: string; price: string }[] = [];

  for (const cat of insertedCategories) {
    const prods = PRODUCTS_BY_CATEGORY[cat.name] ?? [];
    for (const prod of prods) {
      const [inserted] = await db
        .insert(products)
        .values({ ...prod, categoryId: cat.id })
        .onConflictDoNothing()
        .returning({ id: products.id, name: products.name, price: products.price });

      if (inserted) {
        insertedProducts.push(inserted);
        console.log(`   ✅ [${cat.name}] ${prod.name} — R$ ${prod.price}`);
      } else {
        const [existing] = await db
          .select({ id: products.id, name: products.name, price: products.price })
          .from(products)
          .where(eq(products.name, prod.name))
          .limit(1);
        if (existing) insertedProducts.push(existing);
        console.log(`   ⚠️  ${prod.name} já existe, pulando...`);
      }
    }
  }

  const productByName = Object.fromEntries(insertedProducts.map((p) => [p.name, p]));

  // Vínculos produto↔ingrediente
  console.log('\n🔗 Vinculando produtos a ingredientes...');
  let piCount = 0;
  for (const [productName, links] of Object.entries(PRODUCT_INGREDIENTS)) {
    const product = productByName[productName];
    if (!product) continue;

    for (const link of links) {
      const ingredientId = ingredientByName[link.ingredient];
      if (!ingredientId) continue;

      await db
        .insert(productIngredients)
        .values({ productId: product.id, ingredientId, quantity: link.quantity })
        .onConflictDoNothing();
      piCount++;
    }
  }
  console.log(`   ✅ ${piCount} vínculos inseridos`);

  // Pedidos, itens e movimentações
  const [{ value: orderCount }] = await db.select({ value: count() }).from(orders);

  if (Number(orderCount) > 0) {
    console.log('\n📦 Pedidos já existem, pulando pedidos e movimentações...');
  } else {
    console.log('\n📦 Criando pedidos...');

    const clientId = clientUser?.id ?? null;
    const baristaId = baristaUser?.id ?? null;

    // Definição dos pedidos com seus itens
    type OrderItem = { productName: string; quantity: number };
    type OrderDef = {
      status: 'RECEIVED' | 'IN_PREPARATION' | 'READY' | 'DELIVERED' | 'CANCELLED';
      notes: string | null;
      items: OrderItem[];
    };

    const ORDERS_DEF: OrderDef[] = [
      {
        status: 'RECEIVED',
        notes: 'Sem açúcar no cappuccino',
        items: [
          { productName: 'Cappuccino', quantity: 1 },
          { productName: 'Pão de Queijo', quantity: 2 },
        ],
      },
      {
        status: 'IN_PREPARATION',
        notes: null,
        items: [
          { productName: 'Latte', quantity: 2 },
          { productName: 'Brownie', quantity: 1 },
        ],
      },
      {
        status: 'READY',
        notes: 'Para viagem',
        items: [
          { productName: 'Espresso', quantity: 2 },
          { productName: 'Croissant', quantity: 1 },
        ],
      },
      {
        status: 'DELIVERED',
        notes: null,
        items: [
          { productName: 'Mocha', quantity: 1 },
          { productName: 'Cheesecake', quantity: 1 },
          { productName: 'Americano', quantity: 1 },
        ],
      },
      {
        status: 'CANCELLED',
        notes: 'Cliente desistiu',
        items: [
          { productName: 'Frappuccino', quantity: 1 },
          { productName: 'Tiramisu', quantity: 1 },
        ],
      },
    ];

    let deliveredOrderId: string | null = null;

    await db.transaction(async (tx) => {
      for (const orderDef of ORDERS_DEF) {
        // Montar itens com snapshots de preço
        const itemsData = orderDef.items
          .map((item) => {
            const product = productByName[item.productName];
            if (!product) return null;
            const unitPrice = parseFloat(product.price);
            const subtotal = unitPrice * item.quantity;
            return {
              productId: product.id,
              productName: product.name,
              unitPrice: unitPrice.toFixed(2),
              quantity: item.quantity,
              subtotal: subtotal.toFixed(2),
            };
          })
          .filter(Boolean) as {
          productId: string;
          productName: string;
          unitPrice: string;
          quantity: number;
          subtotal: string;
        }[];

        const totalAmount = itemsData
          .reduce((sum, i) => sum + parseFloat(i.subtotal), 0)
          .toFixed(2);

        const [inserted] = await tx
          .insert(orders)
          .values({
            clientId,
            clientName: 'Cliente Teste',
            baristaId,
            status: orderDef.status,
            notes: orderDef.notes,
            totalAmount,
          })
          .returning({ id: orders.id });

        if (orderDef.status === 'DELIVERED') {
          deliveredOrderId = inserted.id;
        }

        for (const item of itemsData) {
          await tx.insert(orderItems).values({ ...item, orderId: inserted.id });
        }

        console.log(`   ✅ [${orderDef.status.padEnd(14)}] R$ ${totalAmount}`);
      }
    });

    // Movimentações de estoque
    console.log('\n📊 Criando movimentações de estoque...');

    // DEDUCTION: consumo vinculado ao pedido entregue
    if (deliveredOrderId) {
      const deductions = [
        { ingredient: 'Café moído', quantity: '21', note: 'Consumo — Mocha + Americano' },
        { ingredient: 'Leite integral', quantity: '200', note: 'Consumo — Mocha' },
        { ingredient: 'Chocolate em pó', quantity: '15', note: 'Consumo — Mocha' },
      ];

      for (const d of deductions) {
        const ingredientId = ingredientByName[d.ingredient];
        if (!ingredientId) continue;
        await db.insert(inventoryMovements).values({
          ingredientId,
          orderId: deliveredOrderId,
          type: 'DEDUCTION',
          quantity: d.quantity,
          note: d.note,
        });
        console.log(`   ✅ DEDUCTION  | ${d.ingredient} — ${d.quantity}`);
      }
    }

    // RESTOCK: reabastecimento sem pedido
    const restocks = [
      { ingredient: 'Café moído', quantity: '1000', note: 'Reposição semanal' },
      { ingredient: 'Leite integral', quantity: '3000', note: 'Reposição semanal' },
      { ingredient: 'Farinha de trigo', quantity: '2000', note: 'Reposição quinzenal' },
    ];

    for (const r of restocks) {
      const ingredientId = ingredientByName[r.ingredient];
      if (!ingredientId) continue;
      await db.insert(inventoryMovements).values({
        ingredientId,
        orderId: null,
        type: 'RESTOCK',
        quantity: r.quantity,
        note: r.note,
      });
      console.log(`   ✅ RESTOCK     | ${r.ingredient} — ${r.quantity}`);
    }

    // ADJUSTMENT: ajuste manual sem pedido
    const adjustments = [
      { ingredient: 'Ovos', quantity: '5', note: 'Ajuste após inventário — ovos quebrados' },
      {
        ingredient: 'Manteiga',
        quantity: '50',
        note: 'Ajuste após inventário — perda por validade',
      },
    ];

    for (const a of adjustments) {
      const ingredientId = ingredientByName[a.ingredient];
      if (!ingredientId) continue;
      await db.insert(inventoryMovements).values({
        ingredientId,
        orderId: null,
        type: 'ADJUSTMENT',
        quantity: a.quantity,
        note: a.note,
      });
      console.log(`   ✅ ADJUSTMENT  | ${a.ingredient} — ${a.quantity}`);
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

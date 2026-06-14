const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- DATABASE COMPREHENSIVE AUDIT ---');

  // Workspaces
  const workspaces = await prisma.workspace.findMany();
  console.log(`\nWorkspaces found: ${workspaces.length}`);
  for (const w of workspaces) {
    console.log(`- ID: ${w.id}, Name: ${w.name}, Slug: ${w.slug}`);
  }

  // Active theme
  const activeTheme = await prisma.theme.findFirst({ where: { isActive: true } });
  console.log(`\nActive Theme: ${activeTheme ? `${activeTheme.name} (${activeTheme.slug})` : 'None'}`);

  // Products
  const products = await prisma.product.findMany({ include: { workspace: true } });
  console.log(`\nProducts found: ${products.length}`);
  products.forEach(p => {
    console.log(`- ID: ${p.id}, Name: ${p.name}, SKU: ${p.sku}, Slug: ${p.slug}, Workspace: ${p.workspace.slug} (${p.workspaceId})`);
  });

  // Posts
  const posts = await prisma.post.findMany({ include: { workspace: true } });
  console.log(`\nPosts found: ${posts.length}`);
  posts.forEach(p => {
    console.log(`- ID: ${p.id}, Title: ${p.title}, Slug: ${p.slug}, Workspace: ${p.workspace.slug} (${p.workspaceId})`);
  });

  // Pages
  const pages = await prisma.page.findMany({ include: { workspace: true } });
  console.log(`\nPages found: ${pages.length}`);
  pages.forEach(p => {
    console.log(`- ID: ${p.id}, Title: ${p.title}, Slug: ${p.slug}, Workspace: ${p.workspace.slug} (${p.workspaceId})`);
  });

  // Orders
  const orders = await prisma.order.findMany({ include: { workspace: true, customer: true } });
  console.log(`\nOrders found: ${orders.length}`);
  orders.forEach(o => {
    console.log(`- ID: ${o.id}, Number: ${o.number}, Customer: ${o.customer.email}, Total: ${o.total}, Workspace: ${o.workspace.slug} (${o.workspaceId})`);
  });

  // Audit Logs
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('\nLatest 5 Audit Logs:');
  logs.forEach(l => {
    console.log(`- [${l.createdAt.toISOString()}] Action: ${l.action}, Entity: ${l.entityType}, Details:`, JSON.parse(l.detailsJson || '{}'));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());


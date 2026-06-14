import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Querying from packages/database...');
  const workspaces = await prisma.workspace.findMany();
  console.log('Workspaces in DB:', workspaces.map(w => ({ id: w.id, slug: w.slug, name: w.name })));

  const products = await prisma.product.findMany();
  console.log('Total products in DB:', products.length);

  const posts = await prisma.post.findMany();
  console.log('Total posts in DB:', posts.length);

  const pages = await prisma.page.findMany();
  console.log('Total pages in DB:', pages.length);

  const orders = await prisma.order.findMany();
  console.log('Total orders in DB:', orders.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());

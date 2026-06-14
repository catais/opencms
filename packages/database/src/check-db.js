const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const workspaces = await prisma.workspace.count();
  console.log(`Users: ${users}, Workspaces: ${workspaces}`);
  const installed = users > 0 && workspaces > 0;
  console.log(`Installed: ${installed}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

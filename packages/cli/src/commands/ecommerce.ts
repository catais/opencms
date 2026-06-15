import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
// @ts-ignore
import Table from 'cli-table3';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export function registerEcommerceCommands(program: Command) {
  program
    .command('ecommerce:install')
    .description('Install ecommerce module and models')
    .action(async () => {
      console.log(chalk.cyan('Installing eCommerce module...'));
      const schemaPath = path.join(process.cwd(), 'packages/database/prisma/schema.prisma');
      if (!fs.existsSync(schemaPath)) {
        console.error(chalk.red('Could not find schema.prisma at packages/database/prisma/schema.prisma'));
        return;
      }

      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      if (schemaContent.includes('model Product')) {
        console.log(chalk.yellow('eCommerce models appear to be installed already.'));
        return;
      }

      const ecommerceModels = `
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  inventory   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  orders      OrderItem[]
}

model Order {
  id          String   @id @default(cuid())
  userId      String?
  total       Float
  status      String   @default("PENDING")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  items       OrderItem[]
}

model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  productId   String
  quantity    Int
  price       Float
  order       Order    @relation(fields: [orderId], references: [id])
  product     Product  @relation(fields: [productId], references: [id])
}
`;
      await fs.appendFile(schemaPath, ecommerceModels);
      console.log(chalk.green('eCommerce models (Product, Order, OrderItem) injected into schema.prisma.'));
      console.log(chalk.yellow('Please run `npx opencms migrate` to apply these changes to your database.'));
    });

  program
    .command('product:list')
    .description('List all products')
    .action(async () => {
      try {
        const clientPath = path.resolve(process.cwd(), 'node_modules/@prisma/client');
        const { PrismaClient } = require(clientPath);
        const prisma = new PrismaClient();
        const products = await prisma.product.findMany({ take: 50 });
        
        if (products.length === 0) {
          console.log(chalk.yellow('No products found.'));
          return;
        }

        const table = new Table({
          head: ['ID', 'Name', 'Price', 'Inventory'],
          colWidths: [30, 40, 10, 15]
        });

        products.forEach((p: any) => {
          table.push([p.id, p.name, p.price, p.inventory]);
        });

        console.log(table.toString());
        await prisma.$disconnect();
      } catch (err: any) {
        console.error(chalk.red('Could not fetch products. Have you run the migrations?'));
        console.error(err.message);
      }
    });

  program
    .command('product:import <file>')
    .description('Import products from a JSON file')
    .action(async (file) => {
      const filePath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        console.error(chalk.red(`File not found: ${filePath}`));
        return;
      }
      try {
        const data = await fs.readJson(filePath);
        if (!Array.isArray(data)) {
          console.error(chalk.red('JSON file must contain an array of products.'));
          return;
        }

        const clientPath = path.resolve(process.cwd(), 'node_modules/@prisma/client');
        const { PrismaClient } = require(clientPath);
        const prisma = new PrismaClient();
        
        let imported = 0;
        for (const item of data) {
          await prisma.product.create({
            data: {
              name: item.name,
              description: item.description || '',
              price: parseFloat(item.price) || 0,
              inventory: parseInt(item.inventory, 10) || 0,
            }
          });
          imported++;
        }

        console.log(chalk.green(`Successfully imported ${imported} products.`));
        await prisma.$disconnect();
      } catch (err: any) {
        console.error(chalk.red('Failed to import products. Ensure your database is migrated.'));
        console.error(err.message);
      }
    });

  program
    .command('order:list')
    .description('List all orders')
    .action(async () => {
      try {
        const clientPath = path.resolve(process.cwd(), 'node_modules/@prisma/client');
        const { PrismaClient } = require(clientPath);
        const prisma = new PrismaClient();
        const orders = await prisma.order.findMany({ take: 50 });
        
        if (orders.length === 0) {
          console.log(chalk.yellow('No orders found.'));
          return;
        }

        const table = new Table({
          head: ['ID', 'Total', 'Status', 'Date'],
          colWidths: [30, 15, 20, 25]
        });

        orders.forEach((o: any) => {
          table.push([o.id, o.total, o.status, o.createdAt.toLocaleDateString()]);
        });

        console.log(table.toString());
        await prisma.$disconnect();
      } catch (err: any) {
        console.error(chalk.red('Could not fetch orders. Have you run the migrations?'));
        console.error(err.message);
      }
    });

  program
    .command('order:export')
    .description('Export orders to a JSON file')
    .action(async () => {
      try {
        const clientPath = path.resolve(process.cwd(), 'node_modules/@prisma/client');
        const { PrismaClient } = require(clientPath);
        const prisma = new PrismaClient();
        const orders = await prisma.order.findMany({ include: { items: true } });
        
        const exportPath = path.join(process.cwd(), 'orders-export.json');
        await fs.writeJson(exportPath, orders, { spaces: 2 });
        
        console.log(chalk.green(`Orders exported successfully to ${exportPath}`));
        await prisma.$disconnect();
      } catch (err: any) {
        console.error(chalk.red('Could not export orders.'));
        console.error(err.message);
      }
    });

  program
    .command('payment:install <gateway>')
    .description('Install payment gateway configuration (e.g. stripe, paypal)')
    .action(async (gateway) => {
      console.log(chalk.cyan(`Installing ${gateway} payment gateway configuration...`));
      const envPath = path.join(process.cwd(), '.env');
      if (!fs.existsSync(envPath)) {
         console.log(chalk.yellow('No .env file found. Skipping variable injection.'));
      } else {
         const configStr = gateway.toLowerCase() === 'stripe' 
           ? `\n# Stripe Configuration\nSTRIPE_PUBLIC_KEY=pk_test_...\nSTRIPE_SECRET_KEY=sk_test_...\nSTRIPE_WEBHOOK_SECRET=whsec_...\n`
           : `\n# ${gateway.toUpperCase()} Configuration\n${gateway.toUpperCase()}_API_KEY=\n`;
         await fs.appendFile(envPath, configStr);
         console.log(chalk.green(`Added ${gateway} variables to .env`));
      }

      console.log(chalk.green(`${gateway} configuration injected! Note: You may need to run npm install for the SDK.`));
    });
}

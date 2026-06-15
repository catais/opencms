import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
export function registerMakeCommands(program) {
    const make = program.command('make').description('Generate project files (models, controllers, etc.)');
    program
        .command('make:model <name>')
        .description('Create a new Prisma model')
        .option('-m, --migration', 'Create a new migration file for the model')
        .option('-c, --controller', 'Create a new controller for the model')
        .option('-r, --resource', 'Create a new resource controller for the model')
        .option('-a, --all', 'Generate a migration, seeder, factory, policy, and resource controller for the model')
        .action(async (name, options) => {
        console.log(chalk.cyan(`Generating model: ${name}`));
        // Basic stub for schema.prisma injection
        const schemaPath = path.join(process.cwd(), 'packages/database/prisma/schema.prisma');
        if (!fs.existsSync(schemaPath)) {
            console.error(chalk.red('Could not find schema.prisma at packages/database/prisma/schema.prisma'));
            return;
        }
        const modelStub = `
model ${name} {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Add your fields here
}
`;
        try {
            await fs.appendFile(schemaPath, modelStub);
            console.log(chalk.green(`Successfully added model ${name} to schema.prisma`));
            if (options.controller || options.resource || options.all) {
                console.log(chalk.blue(`Generating controller for ${name}... (Not fully implemented in Phase 1)`));
            }
        }
        catch (err) {
            console.error(chalk.red('Failed to generate model.'));
        }
    });
    program
        .command('make:controller <name>')
        .description('Create a new controller class')
        .option('-r, --resource', 'Create a new resource controller')
        .option('--api', 'Create a new API controller')
        .action((name, options) => {
        console.log(chalk.cyan(`Generating controller: ${name}`));
        console.log(chalk.yellow('Note: Controller generation will place files in apps/web/src/app/api/... (Not fully implemented in Phase 1)'));
    });
    program
        .command('make:component <name>')
        .description('Create a new React/Next.js component')
        .action(async (name) => {
        console.log(chalk.cyan(`Generating component: ${name}`));
        const componentPath = path.join(process.cwd(), `apps/web/src/components/ui/${name}.tsx`);
        await fs.ensureDir(path.dirname(componentPath));
        const stub = `import React from 'react';

interface \${name}Props {
  className?: string;
}

export const \${name}: React.FC<\${name}Props> = ({ className }) => {
  return (
    <div className={className}>
      {/* \${name} Component */}
    </div>
  );
};
`;
        await fs.writeFile(componentPath, stub);
        console.log(chalk.green(`Component created at: ${componentPath}`));
    });
    program
        .command('make:page <route>')
        .description('Create a new Next.js page')
        .action(async (route) => {
        console.log(chalk.cyan(`Generating page for route: ${route}`));
        const pagePath = path.join(process.cwd(), `apps/web/src/app/${route}/page.tsx`);
        await fs.ensureDir(path.dirname(pagePath));
        const componentName = route.split('/').pop()?.replace(/-/g, '') || 'Page';
        const capitalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1) + 'Page';
        const stub = `import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${capitalizedName} | OpenCMS',
};

export default function ${capitalizedName}() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold">${capitalizedName}</h1>
      </div>
    </main>
  );
}
`;
        await fs.writeFile(pagePath, stub);
        console.log(chalk.green(`Page created at: ${pagePath}`));
    });
    program
        .command('make:theme <name>')
        .description('Create a new theme')
        .action(async (name) => {
        console.log(chalk.cyan(`Generating theme: ${name}`));
        const themePath = path.join(process.cwd(), `apps/web/src/themes/${name}`);
        await fs.ensureDir(themePath);
        const stub = `{
  "name": "${name}",
  "version": "1.0.0",
  "colors": {
    "primary": "#000000",
    "secondary": "#ffffff"
  }
}
`;
        await fs.writeFile(path.join(themePath, 'theme.json'), stub);
        console.log(chalk.green(`Theme created at: ${themePath}`));
    });
    program
        .command('make:plugin <name>')
        .description('Create a new plugin')
        .action(async (name) => {
        console.log(chalk.cyan(`Generating plugin: ${name}`));
        const pluginPath = path.join(process.cwd(), `plugins/${name}`);
        await fs.ensureDir(pluginPath);
        const stub = `{
  "name": "${name}",
  "version": "1.0.0",
  "main": "index.js"
}
`;
        await fs.writeFile(path.join(pluginPath, 'package.json'), stub);
        console.log(chalk.green(`Plugin created at: ${pluginPath}`));
    });
    program
        .command('make:seeder <name>')
        .description('Create a new seeder class')
        .action(async (name) => {
        console.log(chalk.cyan(`Generating seeder: ${name}`));
        const seederPath = path.join(process.cwd(), `packages/database/prisma/seeders/${name}.ts`);
        await fs.ensureDir(path.dirname(seederPath));
        const stub = `import { PrismaClient } from '@prisma/client';

export async function seed${name}(prisma: PrismaClient) {
  // Add seeding logic here
}
`;
        await fs.writeFile(seederPath, stub);
        console.log(chalk.green(`Seeder created at: ${seederPath}`));
    });
    program
        .command('make:middleware <name>')
        .description('Create a new middleware')
        .action(async (name) => {
        console.log(chalk.cyan(`Generating middleware: ${name}`));
        const middlewarePath = path.join(process.cwd(), `apps/web/src/middleware/${name}.ts`);
        await fs.ensureDir(path.dirname(middlewarePath));
        const stub = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function ${name}Middleware(request: NextRequest) {
  // Add middleware logic here
  return NextResponse.next();
}
`;
        await fs.writeFile(middlewarePath, stub);
        console.log(chalk.green(`Middleware created at: ${middlewarePath}`));
    });
}

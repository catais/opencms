import { Command } from 'commander';
import chalk from 'chalk';
import * as p from '@clack/prompts';
import fs from 'fs-extra';
import path from 'path';

export function registerMakeCommands(program: Command) {
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
      } catch (err) {
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
}

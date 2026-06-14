import chalk from 'chalk';
import * as p from '@clack/prompts';
import { execa } from 'execa';
export function registerDbCommands(program) {
    program
        .command('migrate')
        .description('Run the database migrations')
        .action(async () => {
        console.log(chalk.blue('Running database migrations...'));
        const s = p.spinner();
        s.start('Migrating database schema');
        try {
            await execa('npx', ['prisma', 'migrate', 'dev'], { stdio: 'pipe' });
            s.stop('Migrations complete!');
        }
        catch (err) {
            s.stop('Migrations failed!');
            console.log(chalk.yellow('Fallback to db push...'));
            try {
                await execa('npx', ['prisma', 'db', 'push', '--schema=packages/database/prisma/schema.prisma', '--accept-data-loss'], { stdio: 'pipe' });
                console.log(chalk.green('Database pushed successfully.'));
            }
            catch (e) {
                console.error(chalk.red('Failed to push database schema.'));
            }
        }
    });
    program
        .command('migrate:fresh')
        .description('Drop all tables and re-run all migrations')
        .option('--seed', 'Seed the database after migration')
        .action(async (options) => {
        console.log(chalk.yellow('Dropping all tables and re-migrating...'));
        try {
            await execa('npx', ['prisma', 'migrate', 'reset', '--force'], { stdio: 'inherit' });
            console.log(chalk.green('Database reset complete.'));
            if (options.seed) {
                console.log(chalk.blue('Running seeders...'));
                await execa('npx', ['ts-node', 'packages/database/src/seed.ts'], { stdio: 'inherit' });
                console.log(chalk.green('Database seeded.'));
            }
        }
        catch (err) {
            console.error(chalk.red('Failed to reset database.'));
        }
    });
    program
        .command('db:seed')
        .description('Seed the database with records')
        .action(async () => {
        console.log(chalk.blue('Running seeders...'));
        try {
            await execa('npx', ['ts-node', 'packages/database/src/seed.ts'], { stdio: 'inherit' });
            console.log(chalk.green('Database seeded.'));
        }
        catch (err) {
            console.error(chalk.red('Failed to seed database.'));
        }
    });
}

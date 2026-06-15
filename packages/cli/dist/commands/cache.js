import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
export function registerCacheCommands(program) {
    program
        .command('cache:clear')
        .description('Clear application cache')
        .action(async () => {
        console.log(chalk.cyan('Clearing application cache...'));
        const cachePath = path.join(process.cwd(), 'apps/web/.next/cache');
        try {
            if (await fs.pathExists(cachePath)) {
                await fs.remove(cachePath);
                console.log(chalk.green('Application cache cleared successfully.'));
            }
            else {
                console.log(chalk.yellow('Cache directory does not exist. Nothing to clear.'));
            }
        }
        catch (err) {
            console.error(chalk.red('Failed to clear application cache.'), err);
        }
    });
    program
        .command('config:clear')
        .description('Remove the configuration cache file')
        .action(async () => {
        console.log(chalk.cyan('Clearing configuration cache...'));
        console.log(chalk.yellow('Note: Configuration cache is managed by Next.js in OpenCMS. Run cache:clear to clear all caches.'));
    });
}

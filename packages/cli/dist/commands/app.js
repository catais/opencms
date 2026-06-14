import chalk from 'chalk';
import * as p from '@clack/prompts';
import { execa } from 'execa';
export function registerAppCommands(program) {
    program
        .command('serve')
        .alias('dev')
        .description('Start the OpenCMS development server')
        .action(async () => {
        console.log(chalk.blue('Starting development server...'));
        try {
            await execa('npm', ['run', 'dev'], { stdio: 'inherit' });
        }
        catch (err) {
            console.error(chalk.red('Failed to start development server.'));
        }
    });
    program
        .command('start')
        .description('Start the OpenCMS production server')
        .action(async () => {
        console.log(chalk.blue('Starting production server...'));
        try {
            await execa('npm', ['start'], { stdio: 'inherit' });
        }
        catch (err) {
            console.error(chalk.red('Failed to start production server.'));
        }
    });
    program
        .command('build')
        .description('Build the OpenCMS project')
        .action(async () => {
        console.log(chalk.blue('Building project...'));
        const s = p.spinner();
        s.start('Compiling Next.js and packages');
        try {
            await execa('npm', ['run', 'build'], { stdio: 'pipe' });
            s.stop('Build complete!');
            console.log(chalk.green('Project built successfully.'));
        }
        catch (err) {
            s.stop('Build failed!');
            console.error(chalk.red('Failed to build project.'));
        }
    });
}

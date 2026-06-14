#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
const program = new Command();
program
    .name('opencms')
    .description('The Premium AI Social-Commerce Platform CLI')
    .version('1.0.0');
// Display logo before help
program.on('--help', () => {
    console.log('\n');
    const logoText = figlet.textSync('OpenCMS', { font: 'Standard' });
    console.log(gradient.pastel.multiline(logoText));
    console.log(chalk.bold.white('The Premium AI Social-Commerce Platform\n'));
});
// We will import and register commands here
import { registerMakeCommands } from './commands/make.js';
import { registerDbCommands } from './commands/db.js';
import { registerAuthCommands } from './commands/auth.js';
import { registerAppCommands } from './commands/app.js';
import { registerStubCommands } from './commands/stubs.js';
registerMakeCommands(program);
registerDbCommands(program);
registerAuthCommands(program);
registerAppCommands(program);
registerStubCommands(program); // For commands coming in future phases
program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}

import chalk from 'chalk';
import * as p from '@clack/prompts';
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
export function registerAuthCommands(program) {
    program
        .command('auth:setup')
        .description('Setup default admin credentials and site title')
        .action(async () => {
        console.log(chalk.blue('Interactive Auth Setup...'));
        const config = await p.group({
            siteTitle: () => p.text({
                message: 'Site Title:',
                placeholder: 'My Store',
            }),
            adminEmail: () => p.text({
                message: 'Administrator Email:',
            }),
            adminName: () => p.text({
                message: 'Administrator Name:',
            }),
            adminPassword: () => p.password({
                message: 'New Administrator Password:',
            }),
        }, {
            onCancel: () => {
                p.cancel('Operation cancelled.');
                process.exit(0);
            },
        });
        const scriptPath = path.join(process.cwd(), 'setup-credentials.js');
        const scriptContent = `
        const { PrismaClient } = require('@prisma/client');
        const { hashPassword } = require('@opencms/auth');
        
        const prisma = new PrismaClient();
        
        async function main() {
          const siteTitle = process.argv[2];
          const adminEmail = process.argv[3];
          const adminName = process.argv[4];
          const adminPassword = process.argv[5];
          
          await prisma.workspace.updateMany({
            where: { slug: 'my-site' },
            data: { name: siteTitle },
          });

          const hashedPassword = await hashPassword(adminPassword);
          
          const defaultAdmin = await prisma.user.findFirst({
            where: { email: 'admin@opencms.com' },
          });

          if (defaultAdmin) {
            await prisma.user.update({
              where: { id: defaultAdmin.id },
              data: {
                email: adminEmail,
                passwordHash: hashedPassword,
                name: adminName,
              },
            });
            console.log("Credentials updated successfully!");
          } else {
             console.log("Could not find default admin user to update. Make sure database is seeded.");
          }
        }
        
        main().catch(console.error).finally(() => prisma.$disconnect());
      `;
        const s = p.spinner();
        s.start('Updating credentials in database...');
        try {
            await fs.writeFile(scriptPath, scriptContent);
            await execa('node', ['setup-credentials.js', config.siteTitle, config.adminEmail, config.adminName, config.adminPassword]);
            await fs.remove(scriptPath);
            s.stop('Credentials updated!');
            console.log(chalk.green('Auth setup complete.'));
        }
        catch (err) {
            s.stop('Update failed.');
            console.error(chalk.red('Failed to update credentials.'));
        }
    });
    program
        .command('user:reset-password <email>')
        .description('Reset a user\'s password')
        .action(async (email) => {
        const newPassword = await p.password({
            message: `Enter new password for ${email}:`,
        });
        if (p.isCancel(newPassword)) {
            p.cancel('Operation cancelled.');
            process.exit(0);
        }
        const scriptPath = path.join(process.cwd(), 'reset-password.js');
        const scriptContent = `
        const { PrismaClient } = require('@prisma/client');
        const { hashPassword } = require('@opencms/auth');
        
        const prisma = new PrismaClient();
        
        async function main() {
          const email = process.argv[2];
          const password = process.argv[3];
          
          const user = await prisma.user.findFirst({ where: { email } });
          if (!user) {
             console.error("User not found!");
             process.exit(1);
          }

          const hashedPassword = await hashPassword(password);
          
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword },
          });
          console.log("Password updated successfully!");
        }
        
        main().catch(console.error).finally(() => prisma.$disconnect());
      `;
        const s = p.spinner();
        s.start('Updating password...');
        try {
            await fs.writeFile(scriptPath, scriptContent);
            const { stdout } = await execa('node', ['reset-password.js', email, newPassword]);
            await fs.remove(scriptPath);
            s.stop('Password updated!');
            console.log(chalk.green(stdout));
        }
        catch (err) {
            s.stop('Update failed.');
            console.error(chalk.red(err.stderr || 'Failed to update password.'));
        }
    });
}

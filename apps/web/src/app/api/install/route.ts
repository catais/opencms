import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@opencms/database';
import { hashPassword } from '@opencms/auth';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { siteTitle, adminEmail, adminPassword, adminName } = body;

    if (!siteTitle || !adminEmail || !adminPassword) {
      return NextResponse.json({
        success: false,
        message: 'Missing required configuration fields. Site Title, Admin Email, and Admin Password are required.',
      }, { status: 400 });
    }

    const rootDir = process.cwd();

    console.log('[Install] Initializing database tables via Prisma DB Push...');
    try {
      execSync('npx prisma db push --schema=packages/database/prisma/schema.prisma --accept-data-loss', {
        cwd: rootDir,
        env: { ...process.env },
        stdio: 'pipe',
      });
    } catch (pushError: any) {
      console.error('[Install] Prisma DB Push failed:', pushError.stderr?.toString() || pushError.message);
      return NextResponse.json({
        success: false,
        message: 'Database synchronization failed during table setup.',
        error: pushError.stderr?.toString() || pushError.message,
      }, { status: 500 });
    }

    console.log('[Install] Seeding high-fidelity products, categories, tags, media, and contents...');
    try {
      execSync('npx ts-node packages/database/src/seed.ts', {
        cwd: rootDir,
        env: { ...process.env },
        stdio: 'pipe',
      });
    } catch (seedError: any) {
      console.error('[Install] Seeding failed:', seedError.stderr?.toString() || seedError.message);
      return NextResponse.json({
        success: false,
        message: 'Database seeding failed during initial contents setup.',
        error: seedError.stderr?.toString() || seedError.message,
      }, { status: 500 });
    }

    console.log('[Install] Customizing default Workspace and Admin credentials...');
    
    // Update Workspace Name
    await prisma.workspace.updateMany({
      where: { slug: 'my-site' },
      data: {
        name: siteTitle,
      },
    });

    // Hash custom admin password
    const hashedPassword = await hashPassword(adminPassword);

    // Seed file creates 'admin@opencms.com' as superadmin. Let's find and update it.
    const defaultAdmin = await prisma.user.findFirst({
      where: { email: 'admin@opencms.com' },
    });

    if (defaultAdmin) {
      await prisma.user.update({
        where: { id: defaultAdmin.id },
        data: {
          email: adminEmail,
          passwordHash: hashedPassword,
          name: adminName || 'Administrator',
        },
      });
      console.log(`[Install] Super admin account customized successfully: ${adminEmail}`);
    } else {
      console.warn('[Install] Seeded administrator account was not found. Creating a new one.');
      // Fallback: If for some reason the seed did not create the user, let's create a Super Admin role and User
      let superAdminRole = await prisma.role.findFirst({
        where: { name: 'Super Admin' },
      });
      if (!superAdminRole) {
        superAdminRole = await prisma.role.create({
          data: { name: 'Super Admin', description: 'Full root server access' },
        });
      }
      const workspace = await prisma.workspace.findFirst({
        where: { slug: 'my-site' },
      });
      if (workspace) {
        const newUser = await prisma.user.create({
          data: {
            email: adminEmail,
            passwordHash: hashedPassword,
            name: adminName || 'Administrator',
            roleId: superAdminRole.id,
          },
        });
        await prisma.userWorkspace.create({
          data: {
            userId: newUser.id,
            workspaceId: workspace.id,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'OpenCMS installed successfully!',
      data: {
        siteTitle,
        adminEmail,
        adminUrl: '/admin',
        frontendUrl: '/',
      }
    });

  } catch (error: any) {
    console.error('[Install] Unexpected installation failure:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected system error occurred during installation.',
      error: error.message,
    }, { status: 500 });
  }
}

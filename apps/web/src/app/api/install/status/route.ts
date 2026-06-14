import { NextResponse } from 'next/server';
import { prisma } from '@opencms/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if we have at least one user and one workspace
    const userCount = await prisma.user.count();
    const workspaceCount = await prisma.workspace.count();
    
    const installed = userCount > 0 && workspaceCount > 0;
    
    return NextResponse.json({
      success: true,
      installed,
      stats: {
        users: userCount,
        workspaces: workspaceCount,
      }
    });
  } catch (error: any) {
    // If the database has not been pushed/migrated yet, or tables are missing,
    // counting will fail. This means the system is NOT installed.
    return NextResponse.json({
      success: true,
      installed: false,
      reason: 'Database tables not prepared / empty database file',
      error: error.message
    });
  }
}

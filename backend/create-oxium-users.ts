import { prisma } from './src/common/config/database.config';
import { connectDatabase, disconnectDatabase } from './src/common/config/database.config';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to create OXIUM company and users for testing
 * 
 * This creates:
 * 1. OXIUM company
 * 2. 7 users with assigned roles:
 *    - Syam Raju (CEO) - ADMIN
 *    - Sooraj (CTO) - ADMIN
 *    - Goutham (Operations Head) - MANAGER
 *    - Akhil (Program Manager) - MANAGER
 *    - Niranjana (HR Head) - MANAGER
 *    - Ali (Intern) - EMPLOYEE
 *    - Anjana (Intern) - EMPLOYEE
 * 
 * Run: npx ts-node create-oxium-users.ts
 */

interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'DEVELOPER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  companyRole: string;
}

const OXIUM_USERS: UserData[] = [
  {
    email: 'syamraju@oxiumev.com',
    firstName: 'Syam',
    lastName: 'Raju',
    role: 'ADMIN',
    companyRole: 'CEO',
  },
  {
    email: 'sooraj@oxiumev.com',
    firstName: 'Sooraj',
    lastName: '',
    role: 'ADMIN',
    companyRole: 'CTO',
  },
  {
    email: 'goutham@oxiumev.com',
    firstName: 'Goutham',
    lastName: '',
    role: 'MANAGER',
    companyRole: 'Operations Head',
  },
  {
    email: 'akhil@oxiumev.com',
    firstName: 'Akhil',
    lastName: '',
    role: 'MANAGER',
    companyRole: 'Program Manager',
  },
  {
    email: 'niranjana@oxiumev.com',
    firstName: 'Niranjana',
    lastName: '',
    role: 'MANAGER',
    companyRole: 'HR Head',
  },
  {
    email: 'ali@oxiumev.com',
    firstName: 'Ali',
    lastName: '',
    role: 'EMPLOYEE',
    companyRole: 'Intern',
  },
  {
    email: 'anjana@oxiumev.com',
    firstName: 'Anjana',
    lastName: '',
    role: 'EMPLOYEE',
    companyRole: 'Intern',
  },
];

const DEFAULT_PASSWORD = 'Welcome123!';

async function createOxiumUsers() {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✓ Database connected\n');

    // 1. Create or find OXIUM company
    console.log('1. Setting up OXIUM company...');
    let company = await prisma.company.findFirst({
      where: {
        OR: [
          { name: 'OXIUM' },
          { domain: 'oxiumev.local' },
        ],
      },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'OXIUM',
          domain: 'oxiumev.local',
          isActive: true,
          primaryColor: '#3B82F6',
          secondaryColor: '#1A1F2E',
        },
      });
      console.log('✓ Company created');
    } else {
      console.log('✓ Company already exists');
    }
    console.log('  ID:', company.id);
    console.log('  Name:', company.name);
    console.log('  Domain:', company.domain, '\n');

    // 2. Create users
    console.log('2. Creating OXIUM users...\n');
    const defaultPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const createdUsers = [];

    for (const userData of OXIUM_USERS) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (existingUser) {
          // Update existing user to ensure correct company and role
          const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              companyId: company.id,
              role: userData.role,
              isActive: true,
            },
          });
          createdUsers.push({
            ...userData,
            id: updatedUser.id,
            status: 'updated',
          });
          console.log(`✓ Updated: ${userData.email} (${userData.role})`);
        } else {
          // Create new user
          const user = await prisma.user.create({
            data: {
              email: userData.email,
              password: defaultPassword,
              firstName: userData.firstName,
              lastName: userData.lastName || null,
              role: userData.role,
              companyId: company.id,
              isActive: true,
            },
          });
          createdUsers.push({
            ...userData,
            id: user.id,
            status: 'created',
          });
          console.log(`✓ Created: ${userData.email} (${userData.role})`);
        }
      } catch (error: any) {
        console.error(`✗ Failed: ${userData.email} - ${error.message}`);
      }
    }

    // 3. Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ OXIUM setup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Company: ${company.name}`);
    console.log(`Company ID: ${company.id}`);
    console.log(`Total Users: ${createdUsers.length}\n`);

    // 4. User credentials table
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('┌─────────────────────┬──────────────────────┬─────────────┬──────────────┐');
    console.log('│ Name                │ Email                │ Role        │ Password     │');
    console.log('├─────────────────────┼──────────────────────┼─────────────┼──────────────┤');

    for (const user of createdUsers) {
      const fullName = `${user.firstName} ${user.lastName || ''}`.trim();
      const nameDisplay = fullName.padEnd(19);
      const emailDisplay = user.email.padEnd(20);
      const roleDisplay = user.role.padEnd(11);
      const passwordDisplay = DEFAULT_PASSWORD.padEnd(12);
      console.log(`│ ${nameDisplay} │ ${emailDisplay} │ ${roleDisplay} │ ${passwordDisplay} │`);
    }

    console.log('└─────────────────────┴──────────────────────┴─────────────┴──────────────┘\n');

    // 5. Role summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👥 Role Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const roleCounts = createdUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [role, count] of Object.entries(roleCounts)) {
      const users = createdUsers.filter(u => u.role === role);
      console.log(`${role}: ${count} user(s)`);
      users.forEach(u => {
        console.log(`  - ${u.firstName} ${u.lastName || ''} (${u.companyRole})`);
      });
      console.log('');
    }

    // 6. Next steps
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 Next Steps:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Users should change password on first login');
    console.log('2. Create departments via Company Hierarchy UI');
    console.log('3. Create roles via Company → Roles');
    console.log('4. Create tasks and flows for leave approval workflow');
    console.log('5. Test the workflow using the user story scenarios\n');

    // 7. Environment variables
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 Environment Variables:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`OXIUM_COMPANY_ID=${company.id}`);
    console.log(`\nOr export it:`);
    console.log(`export OXIUM_COMPANY_ID="${company.id}"\n`);

  } catch (error) {
    console.error('❌ Error creating OXIUM users:', error);
    if (error instanceof Error) {
      console.error('  Error message:', error.message);
      console.error('  Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    // Disconnect from database
    await disconnectDatabase();
    console.log('✓ Database disconnected');
    process.exit(0);
  }
}

createOxiumUsers();


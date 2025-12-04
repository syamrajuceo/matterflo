import { prisma } from './src/common/config/database.config';
import { connectDatabase, disconnectDatabase } from './src/common/config/database.config';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to create test company and user for testing
 * 
 * This creates:
 * 1. A test company
 * 2. A test user (admin) associated with that company
 * 
 * Run: ts-node create-test-data.ts
 */
async function createTestData() {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✓ Database connected\n');

    // Check if test company already exists
    let company = await prisma.company.findFirst({
      where: { domain: 'test-company.local' },
    });

    if (!company) {
      // 1. Create Company
      console.log('1. Creating test company...');
      company = await prisma.company.create({
        data: {
          name: 'Test Company',
          domain: 'test-company.local',
          isActive: true,
        },
      });
      console.log('✓ Company created');
    } else {
      console.log('✓ Company already exists');
    }
    console.log('  ID:', company.id);
    console.log('  Name:', company.name);
    console.log('  Domain:', company.domain, '\n');

    // Check if test user already exists
    let user = await prisma.user.findFirst({
      where: { email: 'admin@test-company.local' },
    });

    if (!user) {
      // 2. Create User (Admin)
      console.log('2. Creating test user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await prisma.user.create({
        data: {
          email: 'admin@test-company.local',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'Admin',
          role: 'ADMIN',
          companyId: company.id,
          isActive: true,
        },
      });
      console.log('✓ User created');
    } else {
      // Update user to ensure companyId is set
      if (!user.companyId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { companyId: company.id },
        });
        console.log('✓ User updated with company ID');
      } else {
        console.log('✓ User already exists');
      }
    }
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Company ID:', user.companyId, '\n');

    // Output for easy copy-paste
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Test data ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Add these to your .env file:');
    console.log(`TEST_COMPANY_ID=${company.id}`);
    console.log(`TEST_USER_ID=${user.id}`);
    console.log('\nOr export them:');
    console.log(`export TEST_COMPANY_ID="${company.id}"`);
    console.log(`export TEST_USER_ID="${user.id}"`);
    console.log('\nYou can also login with:');
    console.log('  Email: admin@test-company.local');
    console.log('  Password: password123\n');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    if (error instanceof Error) {
      console.error('  Error message:', error.message);
    }
  } finally {
    // Disconnect from database
    await disconnectDatabase();
    console.log('✓ Database disconnected');
    process.exit(0);
  }
}

createTestData();


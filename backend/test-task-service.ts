import { taskService } from './src/modules/tasks/task.service';
import { connectDatabase, disconnectDatabase } from './src/common/config/database.config';
import { prisma } from './src/common/config/database.config';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test script for Task Service
 * 
 * This script will automatically create test company and user if they don't exist.
 * 
 * To run: npm run test:task
 */
async function ensureTestData() {
  // Check if test company exists
  let company = await prisma.company.findFirst({
    where: { domain: 'test-company.local' },
  });

  if (!company) {
    console.log('Creating test company...');
    company = await prisma.company.create({
      data: {
        name: 'Test Company',
        domain: 'test-company.local',
        isActive: true,
      },
    });
    console.log('✓ Test company created:', company.id);
  } else {
    console.log('✓ Test company found:', company.id);
  }

  // Check if test user exists
  let user = await prisma.user.findFirst({
    where: { email: 'admin@test-company.local' },
  });

  if (!user) {
    console.log('Creating test user...');
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
    console.log('✓ Test user created:', user.id);
  } else {
    if (!user.companyId) {
      // Update user to ensure companyId is set
      user = await prisma.user.update({
        where: { id: user.id },
        data: { companyId: company.id },
      });
      console.log('✓ Test user updated with company ID');
    } else {
      console.log('✓ Test user found:', user.id);
    }
  }

  return { companyId: company.id, userId: user.id };
}

async function test() {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✓ Database connected\n');

    // Get or create test data
    const { companyId, userId } = await ensureTestData();
    console.log(`Using Company ID: ${companyId}`);
    console.log(`Using User ID: ${userId}\n`);

    // 1. Create task
    console.log('1. Creating task...');
    const task = await taskService.createTask({
      name: 'Employee Onboarding Form',
      description: 'New employee information',
      companyId: companyId,
      createdById: userId
    });
    console.log('✓ Task created:', task.id);
    console.log('  Name:', task.name);
    console.log('  Status:', task.status);
    console.log('  Version:', task.version);
    console.log('  Fields:', task.fields.length, '\n');

    // 2. Add text field
    console.log('2. Adding text field...');
    const taskWithTextField = await taskService.addField(task.id, {
      type: 'text',
      label: 'Full Name',
      required: true,
    });
    console.log('✓ Field added');
    console.log('  Total fields:', taskWithTextField.fields.length);
    console.log('  Last field:', taskWithTextField.fields[taskWithTextField.fields.length - 1].label, '\n');

    // 3. Add number field
    console.log('3. Adding number field...');
    const taskWithNumberField = await taskService.addField(task.id, {
      type: 'number',
      label: 'Employee ID',
      required: true,
      validation: { min: 1000, max: 9999 },
    });
    console.log('✓ Number field added');
    console.log('  Total fields:', taskWithNumberField.fields.length);
    console.log('  Last field:', taskWithNumberField.fields[taskWithNumberField.fields.length - 1].label, '\n');

    // 4. Get task
    console.log('4. Retrieving task...');
    const updated = await taskService.getTask(task.id);
    if (updated) {
      console.log('✓ Task retrieved');
      console.log('  Fields:', updated.fields.length);
      updated.fields.forEach((field, index) => {
        console.log(`  Field ${index + 1}:`, field.label, `(${field.type})`);
      });
      console.log('');
    } else {
      console.log('✗ Task not found\n');
    }

    // 5. List tasks
    console.log('5. Listing tasks...');
    const list = await taskService.listTasks({
      companyId: companyId,
      page: 1,
      limit: 10
    });
    console.log('✓ Tasks listed');
    console.log('  Total tasks:', list.total);
    console.log('  Page:', list.page);
    console.log('  Total pages:', list.totalPages);
    console.log('  Tasks in this page:', list.tasks.length, '\n');

    // 6. Publish task
    console.log('6. Publishing task...');
    const published = await taskService.publishTask(task.id);
    console.log('✓ Task published');
    console.log('  Status:', published.status);
    console.log('  Published at:', published.publishedAt, '\n');

    console.log('✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('  Error message:', error.message);
      console.error('  Stack:', error.stack);
    }
  } finally {
    // Disconnect from database
    await disconnectDatabase();
    console.log('\n✓ Database disconnected');
    process.exit(0);
  }
}

test();

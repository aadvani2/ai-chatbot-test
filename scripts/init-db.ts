import { initializeDatabase, createUser } from '../app/lib/database';
import bcrypt from 'bcryptjs';

async function init() {
  console.log('Initializing database...');
  await initializeDatabase();
  console.log('Database initialized.');

  // Create default admin user if it doesn't exist
  const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
  const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    await createUser(defaultUsername, passwordHash);
    console.log(`Default admin user created: ${defaultUsername} / ${defaultPassword}`);
    console.log('⚠️  Please change the default password in production!');
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint')) {
      console.log('Admin user already exists.');
    } else {
      console.error('Error creating admin user:', error);
    }
  }

  console.log('Initialization complete!');
  process.exit(0);
}

init().catch((error) => {
  console.error('Initialization failed:', error);
  process.exit(1);
});


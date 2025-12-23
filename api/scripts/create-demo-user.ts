// Create a demo user for testing
import * as bcrypt from 'bcryptjs';
import { query } from '../src/shared/common/db';

async function createDemoUser() {
  const email = 'demo@example.com';
  const password = 'demo123';
  const name = 'Demo User';
  const role = 'user';

  try {
    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existing.rows.length > 0) {
      console.log('Demo user already exists. Updating password...');
      const hash = await bcrypt.hash(password, 10);
      await query(
        'UPDATE users SET password_hash = $1, name = $2, role = $3 WHERE email = $4',
        [hash, name, role, email]
      );
      console.log('✓ Demo user password updated');
    } else {
      console.log('Creating demo user...');
      const hash = await bcrypt.hash(password, 10);
      await query(
        `INSERT INTO users (id, email, password_hash, name, role, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'active', now(), now())
         RETURNING id, email, name, role`,
        [email, hash, name, role]
      );
      console.log('✓ Demo user created');
    }

    console.log('\n📧 Login Credentials:');
    console.log('   Email: demo@example.com');
    console.log('   Password: demo123');
    console.log('\n');
  } catch (error: any) {
    console.error('Error creating demo user:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  createDemoUser()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}


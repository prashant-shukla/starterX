// Create demo users for all three roles: super_admin, admin, and user
import * as bcrypt from 'bcryptjs';
import { query } from '../src/shared/common/db';

interface DemoUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'user';
  tenantId?: string | null;
}

async function createDemoUsers() {
  const demoUsers: DemoUser[] = [
    {
      email: 'superadmin@example.com',
      password: 'demo123',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      tenantId: null, // Super admin doesn't need a tenant
    },
    {
      email: 'admin@example.com',
      password: 'demo123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      tenantId: null, // Will be assigned to default tenant
    },
    {
      email: 'user@example.com',
      password: 'demo123',
      firstName: 'Regular',
      lastName: 'User',
      role: 'user',
      tenantId: null, // Will be assigned to default tenant
    },
  ];

  try {
    // Get or create default tenant
    let defaultTenantId: string | null = null;
    const tenantCheck = await query('SELECT id FROM tenants WHERE slug = $1 LIMIT 1', ['default']);
    
    if (tenantCheck.rows.length > 0) {
      defaultTenantId = tenantCheck.rows[0].id;
    } else {
      // Create default tenant
      const tenantResult = await query(
        `INSERT INTO tenants (id, name, slug, status, created_at, updated_at)
         VALUES (gen_random_uuid(), 'Demo Tenant', 'default', 'active', now(), now())
         RETURNING id`,
        []
      );
      defaultTenantId = tenantResult.rows[0].id;
      console.log('✓ Created default tenant');
    }

    console.log('\n📝 Creating demo users...\n');

    for (const demoUser of demoUsers) {
      // Check if user already exists
      const existing = await query('SELECT id, role, tenant_id FROM users WHERE email = $1', [demoUser.email]);
      
      let tenantId = demoUser.tenantId;
      // Assign to default tenant if not super_admin
      if (demoUser.role !== 'super_admin' && !tenantId) {
        tenantId = defaultTenantId;
      }

      if (existing.rows.length > 0) {
        console.log(`⚠️  User ${demoUser.email} already exists. Updating...`);
        const hash = await bcrypt.hash(demoUser.password, 10);
        await query(
          `UPDATE users 
           SET password_hash = $1, 
               first_name = $2, 
               last_name = $3, 
               role = $4, 
               tenant_id = $5,
               name = $6,
               status = 'active'
           WHERE email = $7`,
          [
            hash,
            demoUser.firstName,
            demoUser.lastName,
            demoUser.role,
            tenantId,
            `${demoUser.firstName} ${demoUser.lastName}`,
            demoUser.email,
          ]
        );
        console.log(`   ✓ Updated ${demoUser.email} (${demoUser.role})`);
      } else {
        console.log(`   Creating ${demoUser.email}...`);
        const hash = await bcrypt.hash(demoUser.password, 10);
        const name = `${demoUser.firstName} ${demoUser.lastName}`;
        
        await query(
          `INSERT INTO users (id, email, password_hash, name, first_name, last_name, role, tenant_id, status, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'active', now(), now())
           RETURNING id, email, name, role`,
          [
            demoUser.email,
            hash,
            name,
            demoUser.firstName,
            demoUser.lastName,
            demoUser.role,
            tenantId,
          ]
        );
        console.log(`   ✓ Created ${demoUser.email} (${demoUser.role})`);
      }
    }

    console.log('\n✅ Demo users created/updated successfully!\n');
    console.log('📧 Demo Credentials:\n');
    console.log('   Super Admin:');
    console.log('   Email: superadmin@example.com');
    console.log('   Password: demo123\n');
    console.log('   Admin:');
    console.log('   Email: admin@example.com');
    console.log('   Password: demo123\n');
    console.log('   User:');
    console.log('   Email: user@example.com');
    console.log('   Password: demo123\n');
  } catch (error: any) {
    console.error('❌ Error creating demo users:', error.message);
    if (error.message?.includes('relation "tenants" does not exist')) {
      console.error('\n⚠️  Please run migrations first: npm run migrate\n');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  createDemoUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}


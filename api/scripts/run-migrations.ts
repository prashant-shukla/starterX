// Simple migration runner
// Run migrations from api/migrations/ directory

import * as fs from 'fs';
import * as path from 'path';
import { query } from '../src/shared/common/db';

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration(s)`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Running ${file}...`);
    try {
      await query(sql);
      console.log(`✓ ${file} completed`);
    } catch (error: any) {
      console.error(`✗ ${file} failed:`, error.message);
      throw error;
    }
  }

  console.log('All migrations completed!');
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}


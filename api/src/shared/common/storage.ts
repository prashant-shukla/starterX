import * as fs from 'fs'
import * as path from 'path'

const isServerless = process.env.VERCEL === '1' ||
  process.env.VERCEL === 'true' ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.cwd() === '/var/task';

const UPLOAD_DIR = isServerless
  ? '/tmp/uploads'
  : path.join(process.cwd(), 'uploads');

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (err: any) {
  console.warn('[Storage] Could not create uploads directory:', err.message);
}

export async function storeFileLocal(file: any) {
  const storage_path = `/uploads/${file.filename}`;
  return { storage_path, key: file.filename };
}

export default { storeFileLocal };

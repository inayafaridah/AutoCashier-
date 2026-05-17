import { comparePassword } from '../src/utils/passwords';

const storedHash = '$2a$10$LL6mBICt9RjX.kn.La8wLOH5tc3yHphXOxBz4qswcpVrQn4N8AjvO';

const candidates = ['admin', 'admin123', 'password', 'password123', 'Admin123', '123456', 'autocashier', 'admin@123'];

async function check() {
  for (const pw of candidates) {
    const match = await comparePassword(pw, storedHash);
    console.log(`"${pw}": ${match ? '✅ MATCH' : '❌ no'}`);
  }
}

check();

import bcrypt from 'bcryptjs';

async function generate() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('adminautocashier', salt);
  console.log('HASH:', hash);
}

generate();

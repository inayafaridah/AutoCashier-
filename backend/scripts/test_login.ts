import { loginWithUsername } from '../src/modules/auth/auth.service';

async function test() {
  const result = await loginWithUsername('admin', 'admin123');
  console.log(JSON.stringify(result, null, 2));
}
test();

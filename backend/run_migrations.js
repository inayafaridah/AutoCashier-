const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("No DATABASE_URL found");
    return;
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to DB");

    const sqlPath = path.join(__dirname, 'migrations', 'create_product_requests.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    console.log("Migration executed successfully");
  } catch (err) {
    console.error("Migration Error:", err.message);
  } finally {
    await client.end();
  }
}
run();

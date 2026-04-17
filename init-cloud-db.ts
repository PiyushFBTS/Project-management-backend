import 'reflect-metadata';
import { config } from 'dotenv';
config();
import * as mysql from 'mysql2/promise';

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Connected to Aiven MySQL');

  // Disable PK requirement for this session so we can create TypeORM internals
  await conn.execute('SET SESSION sql_require_primary_key = 0');
  console.log('Disabled sql_require_primary_key for session');

  // Create typeorm_metadata if missing
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS typeorm_metadata (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      type varchar(255) NOT NULL,
      \`database\` varchar(255) NULL,
      \`schema\` varchar(255) NULL,
      \`table\` varchar(255) NULL,
      name varchar(255) NULL,
      value text NULL
    ) ENGINE=InnoDB
  `);
  console.log('typeorm_metadata OK');

  // Create migrations table if missing
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      timestamp bigint NOT NULL,
      name varchar(255) NOT NULL
    ) ENGINE=InnoDB
  `);
  console.log('migrations OK');

  // Show existing tables
  const [rows] = await conn.execute('SHOW TABLES');
  console.log('Tables:', (rows as any[]).map((r: any) => Object.values(r)[0]));

  await conn.end();
  console.log('Done');
}

run().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

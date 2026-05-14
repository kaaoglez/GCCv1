// Cross-platform setup script for Gran Canaria Conecta
// Run: node setup.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('');
console.log('🏝️  GRAN CANARIA CONECTA - Setup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// 1. Ensure db directory exists
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('✅ Created db/ directory');
} else {
  console.log('✅ db/ directory exists');
}

// 2. Check .env file exists
const envFile = path.join(__dirname, '.env');
if (!fs.existsSync(envFile)) {
  const envExample = path.join(__dirname, '.env.example');
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envFile);
    console.log('✅ Created .env from .env.example');
  } else {
    fs.writeFileSync(envFile, 'DATABASE_URL=file:./db/custom.db\n');
    console.log('✅ Created .env with default DATABASE_URL');
  }
} else {
  console.log('✅ .env file exists');
}

// 3. Generate Prisma client
console.log('');
console.log('📦 Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname });
} catch (e) {
  console.error('❌ Failed to generate Prisma client');
  process.exit(1);
}

// 4. Push schema to database
console.log('');
console.log('🗃️  Pushing schema to database...');
try {
  execSync('npx prisma db push', { stdio: 'inherit', cwd: __dirname });
} catch (e) {
  console.error('❌ Failed to push schema');
  process.exit(1);
}

// 5. Seed database
console.log('');
console.log('🌱 Seeding database...');
try {
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', cwd: __dirname });
} catch (e) {
  console.error('❌ Failed to seed database (you can ignore this if data already exists)');
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Setup complete! Run "bun run dev" to start.');
console.log('');

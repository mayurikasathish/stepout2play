#!/usr/bin/env node
/**
 * Prisma Schema Viewer
 * Run with: node view-schema.js
 *
 * Displays the Prisma schema in a readable format
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║          PRISMA SCHEMA VIEWER - StepOut2Play               ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

try {
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found at:', schemaPath);
    process.exit(1);
  }

  const schema = fs.readFileSync(schemaPath, 'utf8');

  console.log('📄 Schema file:', schemaPath);
  console.log('═'.repeat(60), '\n');

  // Parse models
  const modelMatches = schema.matchAll(/model\s+(\w+)\s*\{([^}]+)\}/g);
  const models = [];

  for (const match of modelMatches) {
    const modelName = match[1];
    const modelBody = match[2];

    // Parse fields
    const fields = [];
    const lines = modelBody.split('\n').filter(l => l.trim() && !l.trim().startsWith('@@') && !l.trim().startsWith('//'));

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Parse field: name type modifiers
      const fieldMatch = trimmed.match(/^(\w+)\s+(\S+)(.*)$/);
      if (fieldMatch) {
        const [, name, type, rest] = fieldMatch;
        const isOptional = type.includes('?');
        const isArray = type.includes('[]');
        const isUnique = rest.includes('@unique');
        const isId = rest.includes('@id');
        const hasDefault = rest.includes('@default');

        fields.push({
          name,
          type: type.replace('?', '').replace('[]', ''),
          optional: isOptional,
          array: isArray,
          unique: isUnique,
          id: isId,
          hasDefault
        });
      }
    }

    models.push({ name: modelName, fields });
  }

  // Display models
  models.forEach((model, i) => {
    console.log(`${i + 1}. 📦 MODEL: ${model.name}`);
    console.log('─'.repeat(60));

    model.fields.forEach(field => {
      const badges = [];
      if (field.id) badges.push('🔑 ID');
      if (field.unique) badges.push('🔒 UNIQUE');
      if (field.hasDefault) badges.push('⚙️ DEFAULT');
      if (field.optional) badges.push('❓ OPTIONAL');
      if (field.array) badges.push('📚 ARRAY');

      const typeDisplay = field.array ? `${field.type}[]` : field.type;
      console.log(`  ${field.name.padEnd(20)} ${typeDisplay.padEnd(20)} ${badges.join(' ')}`);
    });

    console.log();
  });

  // Parse enums
  const enumMatches = schema.matchAll(/enum\s+(\w+)\s*\{([^}]+)\}/g);
  const enums = [];

  for (const match of enumMatches) {
    const enumName = match[1];
    const enumBody = match[2];
    const values = enumBody.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('//'));

    enums.push({ name: enumName, values });
  }

  if (enums.length > 0) {
    console.log('═'.repeat(60));
    console.log('\n🏷️  ENUMS\n');

    enums.forEach((e, i) => {
      console.log(`${i + 1}. ${e.name}:`);
      e.values.forEach(v => console.log(`   - ${v}`));
      console.log();
    });
  }

  console.log('═'.repeat(60));
  console.log(`\n✅ Total Models: ${models.length}`);
  console.log(`✅ Total Enums: ${enums.length}\n`);

} catch (error) {
  console.error('❌ Error reading schema:', error.message);
  process.exit(1);
}

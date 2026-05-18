const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'backend', 'src', 'modules');

function fixFileImports(fullPath) {
  let content = fs.readFileSync(fullPath, 'utf8');

  // Fix middleware and models paths
  content = content.replace(/from '\.\.\/middleware/g, "from '../../middleware");
  content = content.replace(/from '\.\.\/models/g, "from '../../models");
  content = content.replace(/from '\.\.\/config/g, "from '../../config");
  content = content.replace(/from '\.\.\/utils/g, "from '../../utils");

  // Fix controller imports inside routes
  // e.g. from '../controllers/authController' -> from './auth.controller'
  content = content.replace(/from '\.\.\/controllers\/([a-zA-Z]+)Controller'/g, (match, p1) => {
    return `from './${p1}.controller'`;
  });
  
  // Specific fix for Promo service inside transaction controller
  content = content.replace(/from '\.\/promo\.service'/g, "from '../promos/promo.service'");

  fs.writeFileSync(fullPath, content, 'utf8');
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      fixFileImports(fullPath);
    }
  }
}

processDir(modulesDir);
console.log('Fixed imports!');

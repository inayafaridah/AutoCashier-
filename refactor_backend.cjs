const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'backend', 'src');
const modulesDir = path.join(srcDir, 'modules');

const modules = {
  auth: {
    controllers: ['authController.ts'],
    services: ['authService.ts'],
    routes: ['auth.ts']
  },
  products: {
    controllers: ['productController.ts'],
    services: ['productService.ts'],
    routes: ['products.ts']
  },
  users: {
    controllers: ['userController.ts', 'profileController.ts'],
    services: ['userService.ts'],
    routes: ['profile.ts']
  },
  transactions: {
    controllers: ['transactionController.ts'],
    services: [],
    routes: []
  },
  promos: {
    controllers: ['promoController.ts'],
    services: ['promoService.ts'],
    routes: ['promos.ts']
  },
  inventory: {
    controllers: ['branchInventoryController.ts', 'branchController.ts'],
    services: ['branchInventoryService.ts'],
    routes: []
  },
  dashboard: {
    controllers: ['overviewController.ts'],
    services: ['overviewService.ts'],
    routes: ['overview.ts']
  },
  broadcasts: {
    controllers: ['broadcastController.ts'],
    services: ['broadcastService.ts'],
    routes: []
  },
  system: {
    controllers: ['healthController.ts', 'debugController.ts', 'migrationController.ts'],
    services: [],
    routes: ['debug.ts']
  }
};

if (!fs.existsSync(modulesDir)) {
  fs.mkdirSync(modulesDir);
}

// 1. Move files
Object.entries(modules).forEach(([modName, modFiles]) => {
  const modPath = path.join(modulesDir, modName);
  if (!fs.existsSync(modPath)) fs.mkdirSync(modPath);

  modFiles.controllers.forEach(f => {
    const src = path.join(srcDir, 'controllers', f);
    if (fs.existsSync(src)) {
      const dest = path.join(modPath, f.replace('Controller', '.controller'));
      fs.renameSync(src, dest);
    }
  });

  modFiles.services.forEach(f => {
    const src = path.join(srcDir, 'services', f);
    if (fs.existsSync(src)) {
      const dest = path.join(modPath, f.replace('Service', '.service'));
      fs.renameSync(src, dest);
    }
  });

  modFiles.routes.forEach(f => {
    const src = path.join(srcDir, 'routes', f);
    if (fs.existsSync(src)) {
      const destName = f === 'profile.ts' ? 'profile.routes.ts' : f.replace('.ts', '.routes.ts');
      const dest = path.join(modPath, destName);
      fs.renameSync(src, dest);
    }
  });
});

// 2. Fix imports in all files in modules/
function fixImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix imports going to config, utils, etc
      // Since they were in src/controllers/..., depth was ../
      // Now they are in src/modules/modName/..., depth is ../../
      content = content.replace(/from '\.\.\/config/g, "from '../../config");
      content = content.replace(/from '\.\.\/utils/g, "from '../../utils");
      
      // Fix intra-module imports (controller importing service)
      // e.g. from '../services/authService' -> from './auth.service'
      content = content.replace(/from '\.\.\/services\/([a-zA-Z]+)Service'/g, (match, p1) => {
        return `from './${p1}.service'`;
      });
      // specific cases:
      content = content.replace(/from '\.\.\/services\/branchInventoryService'/g, "from './branchInventory.service'");

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

fixImports(modulesDir);
console.log('Done refactoring backend structure!');

const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'src', 'modules');
const dashPagesDir = path.join(modulesDir, 'dashboard', 'pages');

const mapping = {
  auth: ['LoginPage.tsx'],
  inventory: ['InventoryPage.tsx', 'AddInventoryPage.tsx'],
  promos: ['PromoPage.tsx'],
  broadcasts: ['BroadcastPage.tsx', 'BroadcastInboxPage.tsx'],
  products: ['MasterProductsPage.tsx'],
};

Object.entries(mapping).forEach(([modName, pages]) => {
  const modPath = path.join(modulesDir, modName);
  const modPagesPath = path.join(modPath, 'pages');
  
  if (!fs.existsSync(modPath)) fs.mkdirSync(modPath);
  if (!fs.existsSync(modPagesPath)) fs.mkdirSync(modPagesPath);
  
  pages.forEach(page => {
    const src = path.join(dashPagesDir, page);
    if (fs.existsSync(src)) {
      const dest = path.join(modPagesPath, page);
      fs.renameSync(src, dest);
    }
  });
});
console.log('Moved remaining pages!');

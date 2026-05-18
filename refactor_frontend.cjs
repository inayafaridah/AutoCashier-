const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const sharedDir = path.join(srcDir, 'shared');
const modulesDir = path.join(srcDir, 'modules');

if (!fs.existsSync(sharedDir)) fs.mkdirSync(sharedDir);
if (!fs.existsSync(modulesDir)) fs.mkdirSync(modulesDir);

// 1. Move shared folders
const sharedFolders = ['components', 'context', 'lib'];
sharedFolders.forEach(folder => {
  const src = path.join(srcDir, folder);
  if (fs.existsSync(src)) {
    const dest = path.join(sharedDir, folder);
    fs.renameSync(src, dest);
  }
});

// 2. Map pages to modules
const pageMapping = {
  dashboard: ['OverviewPage.tsx', 'SystemDebugPage.tsx'],
  products: ['ProductCatalogPage.tsx', 'AddProductPage.tsx'],
  cashier: ['POSPage.tsx', 'CartSummaryPage.tsx', 'ReceiptVerificationPage.tsx'],
  inventory: ['BranchInventoryPage.tsx'],
  users: ['UsersPage.tsx', 'ProfilePage.tsx'],
  promos: ['CreatePromoPage.tsx']
};

const pagesDir = path.join(srcDir, 'pages');
if (fs.existsSync(pagesDir)) {
  Object.entries(pageMapping).forEach(([modName, pages]) => {
    const modPath = path.join(modulesDir, modName);
    const modPagesPath = path.join(modPath, 'pages');
    
    if (!fs.existsSync(modPath)) fs.mkdirSync(modPath);
    if (!fs.existsSync(modPagesPath)) fs.mkdirSync(modPagesPath);
    
    pages.forEach(page => {
      const src = path.join(pagesDir, page);
      if (fs.existsSync(src)) {
        const dest = path.join(modPagesPath, page);
        fs.renameSync(src, dest);
      }
    });
  });
  
  // Clean up any remaining pages (maybe NotFound?) or delete pages dir if empty
  const remaining = fs.readdirSync(pagesDir);
  if (remaining.length === 0) {
    fs.rmdirSync(pagesDir);
  } else {
    // move remaining to dashboard just in case
    const dashPagesPath = path.join(modulesDir, 'dashboard', 'pages');
    remaining.forEach(page => {
      fs.renameSync(path.join(pagesDir, page), path.join(dashPagesPath, page));
    });
    fs.rmdirSync(pagesDir);
  }
}

// 3. Fix imports in all frontend files
function fixFrontendImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixFrontendImports(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace @/components with @/shared/components, etc
      content = content.replace(/@\/components\//g, '@/shared/components/');
      content = content.replace(/@\/context\//g, '@/shared/context/');
      content = content.replace(/@\/lib\//g, '@/shared/lib/');
      
      // Fix imports of pages in App.tsx
      if (file === 'App.tsx') {
        Object.entries(pageMapping).forEach(([modName, pages]) => {
          pages.forEach(page => {
            const pageName = page.replace('.tsx', '');
            const regex = new RegExp(`import ${pageName} from '(\\.|\.\.)/pages/${pageName}';`, 'g');
            content = content.replace(regex, `import ${pageName} from './modules/${modName}/pages/${pageName}';`);
            
            // Also if someone did import { X } from '@/pages/...'
            const regexAt = new RegExp(`@/pages/${pageName}`, 'g');
            content = content.replace(regexAt, `@/modules/${modName}/pages/${pageName}`);
          });
        });
      }

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

fixFrontendImports(srcDir);
console.log('Done refactoring frontend structure!');

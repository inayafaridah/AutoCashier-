import { Router } from 'express';
import healthController from '../modules/system/health.controller';
import authRoutes from '../modules/auth/auth.routes';
import productsRoutes from '../modules/products/products.routes';
import debugRoutes from '../modules/system/debug.routes';
import profileRoutes from '../modules/users/profile.routes';

import overviewRoutes from '../modules/dashboard/overview.routes';
import promoRoutes from '../modules/promos/promos.routes';
import * as userController from '../modules/users/user.controller';
import * as branchInventoryController from '../modules/inventory/branchInventory.controller';
import branchAdminInventoryRoutes from '../modules/inventory/inventory.routes'; // <-- NEW
import * as broadcastController from '../modules/broadcasts/broadcast.controller';
import * as branchController from '../modules/inventory/branch.controller';
import * as transactionController from '../modules/transactions/transaction.controller';
import monitorRoutes from '../modules/monitor/monitor.routes';


const router = Router();

router.get('/health', healthController);

router.use('/auth', authRoutes);

router.use('/products', productsRoutes);

router.use('/debug', debugRoutes);

router.use('/profile', profileRoutes);



router.use('/overview', overviewRoutes);
router.use('/promos', promoRoutes);
router.use('/monitor', monitorRoutes);

// Branch Admin RBAC Routes
router.use('/inventory', branchAdminInventoryRoutes);

// Broadcasts
router.get('/broadcasts', broadcastController.getBroadcasts);
router.post('/broadcasts', broadcastController.sendBroadcast);

// Users
router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.patch('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.post('/users/:id/promos', userController.assignMemberPromo);

// Legacy Branch Inventory (For backwards compatibility if needed)
router.get('/branches', branchController.getBranches);
router.get('/branch-inventory', branchInventoryController.listBranchSummaries);
router.get('/branch-inventory/:id/movements', branchInventoryController.getMovements);
router.get('/branch-inventory/:id', branchInventoryController.getBranchInventoryDetails);
router.post('/branch-inventory', branchInventoryController.addInventory);
router.post('/branch-inventory/adjust', branchInventoryController.adjustInventory);
router.patch('/branch-inventory/:id', branchInventoryController.updateInventory);
router.delete('/branch-inventory/:id', branchInventoryController.deleteInventory);

// Transactions & Settings
router.post('/checkout', transactionController.checkout);
router.get('/store-settings', transactionController.getStoreSettings);



export default router;

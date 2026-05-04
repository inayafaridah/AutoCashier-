import { Router } from 'express';
import healthController from '../controllers/healthController';
import authRoutes from './auth';
import productsRoutes from './products';
import debugRoutes from './debug';
import detectionRoutes from './detection';
import overviewRoutes from './overview';
import promoRoutes from './promos';
import * as userController from '../controllers/userController';
import * as branchInventoryController from '../controllers/branchInventoryController';
import * as broadcastController from '../controllers/broadcastController';
import * as branchController from '../controllers/branchController';
import * as transactionController from '../controllers/transactionController';

const router = Router();

router.get('/health', healthController);

router.use('/auth', authRoutes);

router.use('/products', productsRoutes);

router.use('/debug', debugRoutes);

router.use('/detect', detectionRoutes);

router.use('/overview', overviewRoutes);
router.use('/promos', promoRoutes);

// Broadcasts
router.get('/broadcasts', broadcastController.getBroadcasts);
router.post('/broadcasts', broadcastController.sendBroadcast);

// Users
router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.patch('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Branch Inventory
router.get('/branches', branchController.getBranches);
router.get('/branch-inventory', branchInventoryController.listBranchSummaries);
router.get('/branch-inventory/:id', branchInventoryController.getBranchInventoryDetails);
router.post('/branch-inventory', branchInventoryController.addInventory);
router.patch('/branch-inventory/:id', branchInventoryController.updateInventory);
router.delete('/branch-inventory/:id', branchInventoryController.deleteInventory);

// Transactions & Settings
router.post('/checkout', transactionController.checkout);
router.get('/store-settings', transactionController.getStoreSettings);

export default router;

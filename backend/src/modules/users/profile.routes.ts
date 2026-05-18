import { Router } from 'express';
import {
  getProfileController,
  updateProfileController,
  updatePasswordController,
  getMemberPointsController,
  uploadProfilePhotoController,
} from './profile.controller';
import { requireAuth } from '../../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all profile routes
router.use(requireAuth);

// GET /api/profile - fetch current user profile + member_points from DB
router.get('/', getProfileController);

// PUT /api/profile - update name, email, whatsapp
router.put('/', updateProfileController);

// PUT /api/profile/password - change password
router.put('/password', updatePasswordController);

import { upload } from '../../middleware/upload';

// GET /api/profile/points - get member points balance
router.get('/points', getMemberPointsController);

// POST /api/profile/photo - upload profile photo
router.post('/photo', upload.single('photo'), uploadProfilePhotoController);

export default router;

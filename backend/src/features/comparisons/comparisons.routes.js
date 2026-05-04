import { Router } from 'express';
import { protect } from '../../middleware/auth.js';
import {
  createComparison,
  getSavedComparisons,
  getComparison,
  toggleSaved,
} from './comparisons.controller.js';

const router = Router();

// /saved must come before /:id
router.post('/', protect, createComparison);
router.get('/saved', protect, getSavedComparisons);
router.get('/:id', getComparison);
router.patch('/:id/save', protect, toggleSaved);

export default router;

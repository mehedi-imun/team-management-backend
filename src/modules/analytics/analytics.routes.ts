import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// All analytics routes require authentication and Admin/Director role
router.get(
  '/summary',
  authenticate,
  authorize('Admin', 'Director'),
  AnalyticsController.getSummary
);

router.get(
  '/teams',
  authenticate,
  authorize('Admin', 'Director'),
  AnalyticsController.getTeamDistribution
);

router.get(
  '/approvals',
  authenticate,
  authorize('Admin', 'Director'),
  AnalyticsController.getApprovalRates
);

export const AnalyticsRoutes = router;

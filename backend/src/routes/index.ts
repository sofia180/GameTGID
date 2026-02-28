import { Router } from 'express';
import { telegramAuth } from '../middleware/telegramAuth.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { me, socketToken } from '../controllers/authController.js';
import {
  createTournamentHandler,
  getTournaments,
  joinTournamentHandler,
  startTournamentHandler,
  completeTournamentHandler,
  participantsHandler,
  matchesHandler
} from '../controllers/tournamentController.js';
import { leaderboard, reportMatch } from '../controllers/matchController.js';
import { paymentIntent, paymentVerify } from '../controllers/paymentController.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.get('/auth/me', telegramAuth, me);
router.get('/auth/socket-token', telegramAuth, socketToken);

router.get('/tournaments', getTournaments);
router.post('/tournaments', adminAuth, createTournamentHandler);
router.post('/tournaments/:id/join', telegramAuth, joinTournamentHandler);
router.get('/tournaments/:id/leaderboard', leaderboard);
router.post('/tournaments/:id/start', adminAuth, startTournamentHandler);
router.post('/tournaments/:id/complete', adminAuth, completeTournamentHandler);
router.get('/tournaments/:id/participants', adminAuth, participantsHandler);
router.get('/tournaments/:id/matches', adminAuth, matchesHandler);

router.post('/matches/:id/report', adminAuth, reportMatch);

router.post('/payments/intent', telegramAuth, paymentIntent);
router.post('/payments/verify', telegramAuth, paymentVerify);

export default router;

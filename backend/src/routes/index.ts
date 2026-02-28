import { Router } from 'express';
import { telegramAuth } from '../middleware/telegramAuth.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { me } from '../controllers/authController.js';
import { createTournamentHandler, getTournaments, joinTournamentHandler } from '../controllers/tournamentController.js';
import { leaderboard, reportMatch } from '../controllers/matchController.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.get('/auth/me', telegramAuth, me);

router.get('/tournaments', getTournaments);
router.post('/tournaments', adminAuth, createTournamentHandler);
router.post('/tournaments/:id/join', telegramAuth, joinTournamentHandler);
router.get('/tournaments/:id/leaderboard', leaderboard);

router.post('/matches/:id/report', adminAuth, reportMatch);

export default router;

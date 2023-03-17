// import Scratch from '../../controllers/scratch.controller';
import express, { Request, Response } from 'express'
import { OutgameService } from '../../services';
const hcPackage = require('../../../../package.json');
const router = express.Router();

router.get('/status', (req: Request, res: Response) => res.json({ status: 200, packageVersion: hcPackage.version }));

router.post('/verify-round', (req: Request, res: Response) => OutgameService.verifyRound(req, res))

router.get('/health-check', async (req: Request, res: Response) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    responseTime: process.hrtime(),
    status: 200
  };
  try {
    res.status(200).json(healthcheck)
  } catch(error) {
    healthcheck.message = JSON.stringify(error);
    healthcheck.status = 500;
    res.status(503).send();
  }
})

export default router

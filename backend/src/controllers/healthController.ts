import { Request, Response } from 'express';

export default function healthController(_req: Request, res: Response) {
  res.json({ status: 'ok', uptime_seconds: process.uptime() });
}

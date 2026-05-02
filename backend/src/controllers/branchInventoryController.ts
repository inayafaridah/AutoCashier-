import { Request, Response } from 'express';
import * as branchService from '../services/branchInventoryService';

export async function listBranchSummaries(req: Request, res: Response) {
  const result = await branchService.getBranchSummaries();
  if (!result.ok) return res.status(500).json({ status: 'error', error: result.error });
  return res.json({ status: 'success', data: result.data });
}

export async function getBranchInventoryDetails(req: Request, res: Response) {
  const { id } = req.params;
  const result = await branchService.getBranchInventory(id);
  if (!result.ok) return res.status(500).json({ status: 'error', error: result.error });
  return res.json({ status: 'success', data: result.data });
}

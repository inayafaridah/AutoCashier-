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

export async function addInventory(req: Request, res: Response) {
  const result = await branchService.addItem(req.body);
  if (!result.ok) return res.status(500).json({ status: 'error', error: result.error });
  return res.json({ status: 'success', data: result.data });
}

export async function updateInventory(req: Request, res: Response) {
  const result = await branchService.updateItem(req.body);
  if (!result.ok) return res.status(500).json({ status: 'error', error: result.error });
  return res.json({ status: 'success', data: result.data });
}

export async function deleteInventory(req: Request, res: Response) {
  const { id } = req.params;
  const { branch_id } = req.query;
  const result = await branchService.deleteItem(id, branch_id as string);
  if (!result.ok) return res.status(500).json({ status: 'error', error: result.error });
  return res.json({ status: 'success' });
}

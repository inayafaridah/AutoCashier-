import { Request, Response } from 'express';
import * as promoService from '../services/promoService';

export async function listPromos(req: Request, res: Response) {
  const result = await promoService.getAllPromos();
  if (!result.ok) return res.status(500).json({ status: 'error', error: result.error });
  return res.json({ status: 'success', data: result.data });
}

export async function createPromoController(req: Request, res: Response) {
  const { title, code, discount_value, discount_type, scope, image_url } = req.body;
  
  if (!title || !code || !discount_value || !discount_type) {
    return res.status(400).json({ status: 'error', error: 'Missing required fields' });
  }

  const result = await promoService.createPromo({
    title,
    code,
    discount_value: Number(discount_value),
    discount_type,
    scope: scope || 'ALL',
    image_url: image_url || null,
    status: 'Active'
  });

  if (!result.ok) return res.status(500).json({ status: 'error', error: result.error });
  return res.status(201).json({ status: 'success', data: result.data });
}

export async function deletePromoController(req: Request, res: Response) {
  const { id } = req.params;
  const result = await promoService.deletePromo(id);
  if (!result.ok) return res.status(500).json({ status: 'error', error: result.error });
  return res.json({ status: 'success' });
}

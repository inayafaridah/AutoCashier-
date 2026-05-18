import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabaseClient';

export const getPromos = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const branchId = user.branch_id;
    const { status } = req.query; // 'active', 'upcoming', 'expired'
    
    let query = supabaseAdmin
      .from('promos')
      .select('*')
      .eq('branch_id', branchId);

    const now = new Date().toISOString();

    if (status === 'active') {
      query = query.lte('start_date', now).gte('end_date', now).eq('is_active', true);
    } else if (status === 'upcoming') {
      query = query.gt('start_date', now).eq('is_active', true);
    } else if (status === 'expired') {
      query = query.lt('end_date', now);
    }

    const { data, error } = await query.order('start_date', { ascending: false });
    if (error) throw error;

    res.json({ status: 'success', data });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const createPromo = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const branchId = user.branch_id;
    
    const { code, name, description, discount_type, discount_value, min_purchase, start_date, end_date } = req.body;

    const { data, error } = await supabaseAdmin
      .from('promos')
      .insert([{
        branch_id: branchId,
        code,
        name,
        description,
        discount_type,
        discount_value,
        min_purchase,
        start_date,
        end_date
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ status: 'success', data });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const updatePromo = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const branchId = user.branch_id;
    const { id } = req.params;
    const updates = req.body;

    // Tenant Isolation
    const { data, error } = await supabaseAdmin
      .from('promos')
      .update(updates)
      .eq('id', id)
      .eq('branch_id', branchId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ status: 'error', message: 'Promo not found or unauthorized' });

    res.json({ status: 'success', data });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const deletePromo = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const branchId = user.branch_id;
    const { id } = req.params;

    // Delete promo completely if it hasn't started yet, or soft deactivate it
    const { data, error } = await supabaseAdmin
      .from('promos')
      .delete()
      .eq('id', id)
      .eq('branch_id', branchId)
      .gt('start_date', new Date().toISOString()) // Only allow deletion if it hasn't started yet
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      // If no data returned, it means it either doesn't exist, unauthorized, or has already started
      return res.status(400).json({ 
        status: 'error', 
        message: 'Promo cannot be deleted. It may have already started or does not exist.' 
      });
    }

    res.json({ status: 'success', message: 'Promo successfully deleted' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

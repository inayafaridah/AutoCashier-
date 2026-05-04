import { Request, Response } from 'express';
import { supabaseAdmin, supabase } from '../config/supabaseClient';

export async function checkout(req: Request, res: Response) {
  try {
    const { header, items } = req.body;
    const db = supabaseAdmin || supabase;

    // 1. Create transaction header
    const { data: trans, error: tErr } = await db.from('transactions').insert({
      invoice_number: header.invoice_number,
      total_price: header.total_price,
      payment_method: header.payment_method,
      cash_received: header.cash_received,
      cash_return: header.cash_return,
      cashier_name: header.cashier_name,
      branch_id: header.branch_id || null,
      created_at: new Date().toISOString()
    }).select().single();

    if (tErr) throw tErr;

    // 2. Create transaction items
    const itemRows = items.map((item: any) => ({
      transaction_id: trans.id,
      product_id: item.product_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal
    }));

    const { error: iErr } = await db.from('transaction_items').insert(itemRows);
    if (iErr) throw iErr;

    // 3. Deduct stock (simplified for now)
    for (const item of items) {
       // Ideally use an RPC or transaction for this
       await db.rpc('deduct_stock', { p_id: item.product_id, qty: item.quantity });
    }

    return res.json({ status: 'success', data: trans });
  } catch (err: any) {
    console.error('[checkout] Error:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
}

export async function getStoreSettings(req: Request, res: Response) {
  return res.json({ 
    status: 'success', 
    data: { 
      store_name: 'AutoCashier AI Store',
      currency: 'IDR'
    } 
  });
}

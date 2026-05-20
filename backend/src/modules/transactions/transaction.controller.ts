import { Request, Response } from 'express';
import { supabaseAdmin, supabase } from '../../config/supabaseClient';
import { isUserTargeted } from '../promos/promo.service';

const db = supabaseAdmin || supabase;

// ─── GET /api/transactions ────────────────────────────────────────────────────
// Super admin: returns all transactions, optionally filtered by branch_id query param
// Branch admin: returns only transactions for their branch (from JWT)
export async function getTransactions(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const {
      branch_id,
      status,
      payment_method,
      start_date,
      end_date,
      sort,
      search,
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
    const offset = (pageNum - 1) * limitNum;

    let query = db
      .from('transactions')
      .select(
        `
        id,
        order_number,
        invoice_number,
        total_price,
        payment_method,
        status,
        payment_status,
        cashier_id,
        member_id,
        receipt_url,
        branch_id,
        created_at,
        cashier:cashier_id (
          id,
          username,
          full_name
        ),
        member:member_id (
          id,
          username,
          full_name
        ),
        transaction_items (
          id,
          quantity,
          unit_price,
          subtotal,
          product_id,
          products (
            id,
            name,
            sku,
            category
          )
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: sort === 'asc' });

    // ── Role-based branch filtering ──────────────────────────────────────────
    if (user.role === 'branch_admin') {
      if (!user.branch_id) {
        return res.status(403).json({
          status: 'error',
          message: 'Branch ID not found in token. Please log in again.',
        });
      }
      query = query.eq('branch_id', user.branch_id);
    } else if (user.role === 'super_admin' && branch_id && branch_id !== 'ALL') {
      query = query.eq('branch_id', branch_id as string);
    }

    // ── Optional filters ─────────────────────────────────────────────────────
    if (status) query = query.eq('status', status as string);
    if (payment_method) query = query.eq('payment_method', payment_method as string);
    if (start_date) query = query.gte('created_at', start_date as string);
    if (end_date) query = query.lte('created_at', end_date as string);
    if (search) {
      query = query.or(
        `invoice_number.ilike.%${search}%,order_number.ilike.%${search}%`
      );
    }

    // ── Pagination ────────────────────────────────────────────────────────────
    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.json({
      status: 'success',
      data: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limitNum),
      },
    });
  } catch (err: any) {
    console.error('[getTransactions] Error:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
}

/**
 * Adds 1% of total_price to member_points for a given user.
 * Creates the record if it doesn't exist, otherwise increments balance.
 */
async function addMemberPoints(userId: string, totalPrice: number) {
  if (!userId || !totalPrice) return;

  const pointsEarned = Math.floor(totalPrice * 0.01); // 1% rounded down
  if (pointsEarned <= 0) return;

  // Check if user already has a member_points record
  const { data: existing } = await db
    .from('member_points')
    .select('id, balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // Update existing balance
    await db
      .from('member_points')
      .update({
        balance: existing.balance + pointsEarned,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  } else {
    // Create new member_points record
    await db
      .from('member_points')
      .insert({
        user_id: userId,
        balance: pointsEarned,
        updated_at: new Date().toISOString()
      });
  }

  console.log(`[checkout] +${pointsEarned} points added for user ${userId}`);
}

/**
 * Deducts points from member_points (when customer uses points to pay).
 * Returns error if insufficient balance.
 */
async function deductMemberPoints(userId: string, pointsToUse: number): Promise<{ ok: boolean; error?: string }> {
  if (!userId || !pointsToUse || pointsToUse <= 0) return { ok: true };

  const { data: existing } = await db
    .from('member_points')
    .select('id, balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing || existing.balance < pointsToUse) {
    return { ok: false, error: 'INSUFFICIENT_POINTS' };
  }

  await db
    .from('member_points')
    .update({
      balance: existing.balance - pointsToUse,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  console.log(`[checkout] -${pointsToUse} points deducted for user ${userId}`);
  return { ok: true };
}

/**
 * Generates a professional transaction code.
 * Example: INV-260517-4821
 */
function generateCode(prefix: string): string {
  const date = new Date();
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear().toString().slice(-2);
  const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  return `${prefix}-${y}${m}${d}-${random}`;
}

function getWIBTime() {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const wib = new Date(utc + (3600000 * 7));
  return wib.getFullYear() + '-' +
    String(wib.getMonth() + 1).padStart(2, '0') + '-' +
    String(wib.getDate()).padStart(2, '0') + ' ' +
    String(wib.getHours()).padStart(2, '0') + ':' +
    String(wib.getMinutes()).padStart(2, '0') + ':' +
    String(wib.getSeconds()).padStart(2, '0');
}

export async function checkout(req: Request, res: Response) {
  try {
    const { header, items } = req.body;

    // --- Member Points: Deduct if used ---
    const memberUserId: string | null = header.member_user_id || null;
    const pointsUsed: number = header.points_used || 0;

    if (memberUserId && pointsUsed > 0) {
      const deductResult = await deductMemberPoints(memberUserId, pointsUsed);
      if (!deductResult.ok) {
        return res.status(400).json({ status: 'error', error: deductResult.error });
      }
    }

    // Auto-generate professional codes if not provided by frontend
    const invoiceNumber = header.invoice_number || generateCode('INV');
    const orderNumber = header.order_number || generateCode('ORD');

    // --- Validate Promo Code if provided ---
    const promoId: string | null = header.promo_id || null;
    let validPromo: any = null;

    if (promoId) {
      const { data: promo, error: promoErr } = await db
        .from('member_promos')
        .select('*')
        .eq('id', promoId)
        .maybeSingle();

      if (promoErr || !promo) {
        return res.status(400).json({ status: 'error', error: 'INVALID_PROMO' });
      }

      if (promo.is_active === false) {
        return res.status(400).json({ status: 'error', error: 'PROMO_INACTIVE' });
      }

      const now = new Date();
      if (promo.starts_at && new Date(promo.starts_at) > now) {
        return res.status(400).json({ status: 'error', error: 'PROMO_NOT_STARTED' });
      }
      if (promo.expires_at && new Date(promo.expires_at) < now) {
        return res.status(400).json({ status: 'error', error: 'PROMO_EXPIRED' });
      }

      if (promo.min_purchase && header.total_price < promo.min_purchase) {
        return res.status(400).json({ status: 'error', error: 'MIN_PURCHASE_NOT_MET' });
      }

      if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
        return res.status(400).json({ status: 'error', error: 'PROMO_QUOTA_FULL' });
      }

      if (promo.per_user_limit && memberUserId) {
        const { count } = await db
          .from('promo_usages')
          .select('*', { count: 'exact', head: true })
          .eq('promo_id', promoId)
          .eq('user_id', memberUserId);

        if (count && count >= promo.per_user_limit) {
          return res.status(400).json({ status: 'error', error: 'USER_PROMO_LIMIT_REACHED' });
        }
      }

      // Check if promo targets specific users
      const isTargeted = await isUserTargeted(promoId, memberUserId);
      if (!isTargeted) {
        return res.status(403).json({ status: 'error', error: 'USER_NOT_TARGETED' });
      }

      validPromo = promo;
    }

    // 1. Create transaction header
    const { data: trans, error: tErr } = await db.from('transactions').insert({
      order_number: orderNumber,
      invoice_number: invoiceNumber,
      total_price: header.total_price,
      payment_method: header.payment_method,
      status: header.status || 'completed',
      cashier_id: header.cashier_id || null,
      member_id: memberUserId || null,
      receipt_url: header.receipt_url || null,
      payment_status: header.payment_status || 'paid',
      created_at: getWIBTime()
    }).select().single();

    if (tErr) {
      console.error('[checkout] Transaction insert error:', tErr);
      throw tErr;
    }

    // 2. Create transaction items
    const itemRows = items.map((item: any) => ({
      transaction_id: trans.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price ?? item.price ?? 0,
      subtotal: item.subtotal ?? (item.quantity * (item.unit_price ?? item.price ?? 0)),
      created_at: getWIBTime()
    }));

    const { error: iErr } = await db.from('transaction_items').insert(itemRows);
    if (iErr) {
      console.error('[checkout] Transaction items insert error:', iErr);
      throw iErr;
    }

    // 3. Deduct stock
    for (const item of items) {
      await db.rpc('deduct_stock', { p_id: item.product_id, qty: item.quantity });
    }

    // --- Member Points: Add 1% earned points ---
    if (memberUserId && header.total_price > 0) {
      await addMemberPoints(memberUserId, header.total_price);
    }

    // --- Record Promo Usage ---
    if (validPromo) {
      await db.from('promo_usages').insert({
        promo_id: validPromo.id,
        user_id: memberUserId || null,
        order_id: trans.id
      });
      await db.rpc('increment_promo_usage', { p_promo_id: validPromo.id });
    }

    // Calculate points earned for response
    const pointsEarned = memberUserId ? Math.floor((header.total_price || 0) * 0.01) : 0;

    return res.json({
      status: 'success',
      data: {
        ...trans,
        points_earned: pointsEarned,
        points_used: pointsUsed,
      }
    });
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
      currency: 'IDR',
      points_rate: 0.01, // 1% of total purchase
      points_currency_rate: 1, // 1 point = Rp 1
    }
  });
}

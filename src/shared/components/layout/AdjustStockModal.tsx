import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

interface AdjustStockModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: any) => void;
  item: any;
  isLoading: boolean;
}

export function AdjustStockModal({ isOpen, onOpenChange, onConfirm, item, isLoading }: AdjustStockModalProps) {
  const [type, setType] = useState('RESTOCK');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) return;
    onConfirm({
      inventoryId: item.inventory_id,
      branchId: item.branch_id,
      productId: item.id,
      type,
      quantity: Number(quantity),
      reason
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl p-8 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-black tracking-tighter text-2xl text-gray-900">Adjust Stock</DialogTitle>
          <DialogDescription className="text-gray-500 font-medium">
            Updating inventory for <span className="font-bold text-gray-900">{item.name}</span>. Current stock: {item.stock}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Movement Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-12 rounded-2xl bg-gray-50 border-none">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="RESTOCK" className="font-bold">Restock (+)</SelectItem>
                <SelectItem value="SALE" className="font-bold">Manual Sale (-)</SelectItem>
                <SelectItem value="DAMAGE" className="font-bold">Damage/Loss (-)</SelectItem>
                <SelectItem value="ADJUSTMENT" className="font-bold">Absolute Adjust (=)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</label>
            <Input 
              type="number" 
              min="1"
              required 
              value={quantity} 
              onChange={e => setQuantity(e.target.value)}
              className="h-12 rounded-2xl bg-gray-50 border-none font-mono text-lg font-bold" 
              placeholder="0"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason / Notes (Optional)</label>
            <Input 
              value={reason} 
              onChange={e => setReason(e.target.value)}
              className="h-12 rounded-2xl bg-gray-50 border-none font-medium" 
              placeholder="e.g. Delivered by supplier ABC"
            />
          </div>
          <DialogFooter className="mt-4 gap-3 sm:gap-0">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="rounded-2xl font-bold text-gray-500"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-600/20"
            >
              {isLoading ? 'Processing...' : 'Confirm Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

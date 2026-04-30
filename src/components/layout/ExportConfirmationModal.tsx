import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown } from 'lucide-react';

interface ExportConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  branchName: string;
}

export function ExportConfirmationModal({
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading,
  branchName
}: ExportConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-[32px] border-none shadow-2xl p-8 bg-white">
        <DialogHeader className="space-y-4">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-2">
            <FileDown className="w-7 h-7 text-indigo-600" />
          </div>
          <DialogTitle className="text-3xl font-black text-gray-900 tracking-tighter leading-none">
            Export Report - {branchName}
          </DialogTitle>
          <DialogDescription className="text-gray-500 font-medium text-base leading-relaxed pt-2">
            Prepare a consolidated PDF report for the current view. This will include sales velocity, revenue metrics, and branch health status for high-level operational review.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 h-14 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/20 font-bold gap-2 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileDown className="w-5 h-5" />
                Confirm & Print
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

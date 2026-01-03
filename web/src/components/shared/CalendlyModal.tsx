import React from "react";
import * as Dialog from "./dialog";

export function CalendlyModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.DialogPortal>
        <Dialog.DialogOverlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.DialogContent
          className="bg-white rounded-2xl shadow-2xl p-0 w-full h-screen flex flex-col justify-between"
          style={{ height: '80vh', width: '80vw', maxWidth: '80vw' }}
        >
          <Dialog.DialogTitle className="text-lg font-semibold mt-6 mb-2 text-center">Book Free Consultation</Dialog.DialogTitle>
          <iframe
            src="https://calendly.com/starterx/30min"
            title="Calendly Scheduling"
            className="w-full flex-1 border-0 rounded-b-2xl"
            allow="camera; microphone;"
          />
        </Dialog.DialogContent>
      </Dialog.DialogPortal>
    </Dialog.Dialog>
  );
}

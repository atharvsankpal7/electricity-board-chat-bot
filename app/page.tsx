"use client";

import { useState } from 'react';
import { VoiceChat } from './components/VoiceChat';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Home() {
  const [extractedAddress, setExtractedAddress] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const handleAddressExtracted = (address: string) => {
    setExtractedAddress(address);
    setShowAddressModal(true);
  };

  return (
    <main>
      <VoiceChat onAddressExtracted={handleAddressExtracted} />
      
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extracted Address</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">{extractedAddress}</p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
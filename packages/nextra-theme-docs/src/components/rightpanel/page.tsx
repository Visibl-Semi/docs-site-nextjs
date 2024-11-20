import React, { useState } from 'react';
import ChatInput from './ChatInput';

const RightPanel = () => {

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-charcoal-900 p-4">
      <ChatInput />
    </div>
  );
};

export default RightPanel;
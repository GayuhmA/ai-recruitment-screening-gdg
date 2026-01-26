"use client";

import { UserProfile } from '@/components/features/UserProfile';

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between h-16 px-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-semibold text-white">Settings</h1>
          <p className="text-sm text-zinc-400">Manage your account and preferences</p>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <UserProfile />
        </div>
      </div>
    </div>
  );
}

"use client";

import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

export function AuthControls() {
  return (
    <div className="flex items-center justify-center gap-2">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            className="px-4 py-1.5 rounded-full text-[11px] font-bold tracking-tight transition-all duration-200 cursor-pointer"
            style={{
              fontFamily: "var(--font-inter)",
              background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
              color: "#060e20",
              boxShadow: "0 4px 12px rgba(133, 173, 255, 0.3)",
            }}
          >
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button
            className="px-4 py-1.5 rounded-full text-[11px] font-bold tracking-tight transition-all duration-200 cursor-pointer"
            style={{
              fontFamily: "var(--font-inter)",
              background: "rgba(25, 37, 64, 0.4)",
              color: "var(--on-surface-muted)",
              border: "1px solid rgba(133, 173, 255, 0.05)",
            }}
          >
            Sign up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";

function BetaSignupFormFallback() {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="h-[46px] rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      <div className="h-[46px] rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      <p className="text-[12px] text-zinc-300 dark:text-zinc-700 text-center pt-3">
        — / 50 자리 남음
      </p>
    </div>
  );
}

const BetaSignupForm = dynamic(() => import("@/components/BetaSignupForm"), {
  ssr: false,
  loading: BetaSignupFormFallback,
});

export default BetaSignupForm;

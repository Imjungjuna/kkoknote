"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "success" | "duplicate" | "error";

const BETA_SLOTS = 50;

export default function BetaSignupForm({
  initialRemaining,
}: {
  initialRemaining: number;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(initialRemaining);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void (async () => {
          const trimmed = email.trim().toLowerCase();
          if (!trimmed) return;

          setStatus("loading");
          setErrorMessage(null);

          try {
            const supabase = createClient();
            const { error } = await supabase
              .from("beta_registrations")
              .insert({ email: trimmed });

            if (error) {
              if (error.code === "23505") {
                setStatus("duplicate");
              } else {
                setStatus("error");
                setErrorMessage(error.message);
              }
              return;
            }

            setRemaining((r) => Math.max(0, r - 1));
            setStatus("success");
          } catch {
            setStatus("error");
            setErrorMessage("오류가 발생했습니다. 다시 시도해 주세요.");
          }
        })();
      }}
      className="flex flex-col gap-2.5"
    >
      {status === "success" ? (
        <div className="w-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 rounded-xl px-5 py-3 flex flex-col items-center justify-center min-h-[86px]">
          <div className="flex flex-col items-center gap-1.5">
            <CheckCircle2
              size={20}
              className="text-emerald-500"
              strokeWidth={1.75}
            />
            <p className="text-[16px] font-semibold text-emerald-700 dark:text-emerald-400">
              대기 명단에 추가되었어요
            </p>
          </div>
          <p className="text-[13px] text-zinc-400 dark:text-zinc-300 mt-2">
            베타 오픈 시 가장 먼저 알려드릴게요.
          </p>
        </div>
      ) : (
        <>
          <input
            type="email"
            required
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-[14px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full text-base bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg px-4 py-3 font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "신청 중…" : "베타테스터 신청하기"}
          </button>

          {status === "duplicate" && (
            <p className="text-[12px] text-zinc-400">
              이미 신청하셨네요 — 베타 오픈 시 연락드릴게요.
            </p>
          )}
          {status === "error" && errorMessage && (
            <p className="text-[12px] text-red-500">{errorMessage}</p>
          )}
        </>
      )}

      {/* Beta 현황 */}
      <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center pt-3">
        <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
          {remaining - 30}
        </span>
        {" / "}
        {BETA_SLOTS} 자리 남음
      </p>
    </form>
  );
}

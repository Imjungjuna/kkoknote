"use client";

import { use } from "react";
import BetaSignupForm from "@/components/BetaSignupForm";

const features = [
  "스크립트 태그 하나로 설치 완료 — 백엔드 불필요",
  "투표, 피드백 보드, 체인지로그 기본 제공",
  "서비스 디자인에 맞는 위젯 커스터마이징",
];

export default function BetaSection({
  remainingPromise,
  hideFeatures,
}: {
  remainingPromise: Promise<number>;
  hideFeatures?: boolean;
}) {
  const initialRemaining = use(remainingPromise);

  return (
    <div className="w-full max-w-sm md:max-w-md flex flex-col gap-10">
      {/* Hero */}
      <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
        <p className="text-sm tracking-wide text-zinc-400 mb-5 font-semibold">
          50명 한정 베타 오픈
        </p>
        <h2 className="text-[2rem] leading-[1.15] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
          유저 피드백,
          <br />
          이제 제대로 받으세요.
        </h2>
        <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          KkokNote는 인디 해커와 개발자를 위한 경량 임베드 피드백 위젯입니다.
          <br />
          스크립트 태그 하나로 바로 시작하세요.
        </p>
      </div>

      {/* Divider */}
      {!hideFeatures && (
        <hr className="border-none h-px bg-zinc-200 dark:bg-zinc-800 -mt-5" />
      )}

      {/* Features */}
      {!hideFeatures && (
        <ul
          className="flex flex-col gap-3 animate-fade-up"
          style={{ animationDelay: "80ms" }}
        >
          {features.map((f, i) => (
            <li key={f} className="flex items-start gap-3">
              <span className="text-[14px] text-zinc-300 dark:text-zinc-600 shrink-0 pt-px font-mono font-semibold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {f}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Form */}
      <div className="animate-fade-up" style={{ animationDelay: "160ms" }}>
        <BetaSignupForm initialRemaining={initialRemaining} />
      </div>
    </div>
  );
}

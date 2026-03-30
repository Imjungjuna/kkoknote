import BetaSection from "@/components/BetaSection";
import { PixelAnimation } from "@/components/ui/pixel-animation";
import WidgetMockup from "@/components/landing/WidgetMockup";

const PAIN_POINTS = [
  "유저가 피드백을 줘도 어디에 기록해야 할지 모른다.",
  "투표 기능 하나 붙이려고 새 서비스를 가입해야 했다.",
  "체인지로그를 README에 적다가 포기했다.",
];

const STEPS = [
  {
    title: "스크립트 태그 삽입",
    desc: "HTML에 <script> 한 줄을 붙여넣으세요. CDN에서 바로 로드됩니다.",
  },
  {
    title: "위젯 자동 등장",
    desc: "페이지 우하단에 피드백 버튼이 나타납니다. 별도 설정 불필요.",
  },
  {
    title: "대시보드에서 관리",
    desc: "제출된 피드백을 칸반으로 정리하고, 체인지로그를 발행하세요.",
  },
];

const FEATURES = [
  {
    title: "투표 시스템",
    desc: "유저가 원하는 기능에 투표. 우선순위가 데이터로 보입니다.",
  },
  {
    title: "체인지로그",
    desc: "업데이트를 발행하고 위젯 안에서 바로 보여주세요.",
  },
  {
    title: "익명 피드백",
    desc: "로그인 없이 누구나 피드백을 남길 수 있어요. 더 많은 목소리를 들을 수 있습니다.",
  },
  {
    title: "커스터마이징",
    desc: "브랜드 색상과 위젯 설정을 프로젝트 키 하나로 관리.",
  },
];

export default function HomePage() {
  return (
    <main className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen">
      {/* Hero — full viewport with pixel background */}
      <section className="relative min-h-screen overflow-hidden flex flex-col">
        {/* Pixel animation background */}
        <div className="absolute inset-0">
          <PixelAnimation
            pixelGap={12}
            animationSpeed={0.2}
            colorHueStart={200}
            colorHueRange={120}
            maxPixelSize={4}
            animationDuration={900}
          />
        </div>
        {/* Bottom fade into page */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent pointer-events-none" />

        {/* Nav */}
        <nav className="relative z-10 max-w-4xl mx-auto w-full px-6 pt-8 pb-4 flex items-center justify-between">
          <span className="bg-zinc-950/80 rounded-lg text-[13px] font-semibold tracking-tight">
            KkokNote
          </span>
          <a
            href="/join-betaTesters"
            className="bg-zinc-950/80 rounded-lg text-[12px] text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            베타 신청 →
          </a>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="max-w-4xl mx-auto w-full px-6 py-20">
            {/* Backdrop blur applied only around text — keeps animation visible outside */}
            <div className="w-fit px-8 py-10 -mx-8">
              <p className=" animate-fade-up text-[12px] tracking-[0.2em] uppercase text-zinc-400 mb-6">
                <span className="bg-zinc-950/80 rounded-lg">
                  {" "}
                  Coming Soon · 베타 모집 중
                </span>
              </p>
              <h1
                className="bg-zinc-950/60 rounded-xl animate-fade-up text-[2rem] md:text-[3.25rem] leading-[1.1] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5 md:mb-7"
                style={{ animationDelay: "60ms" }}
              >
                저 점 하나하나가
                <br />
                유저 피드백입니다.
              </h1>
              <p
                className="animate-fade-up bg-zinc-950/65 rounded-xl text-[17px] md:text-[19px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mb-10 md:mb-12 md:leading-[1.7]"
                style={{ animationDelay: "120ms" }}
              >
                KkokNote가 흩어진 피드백을 모아드립니다.
                <br />
                스크립트 태그 하나로 5분 안에 시작하세요.
              </p>
              <div
                className="animate-fade-up flex items-center gap-4"
                style={{ animationDelay: "180ms" }}
              >
                <a
                  href="/join-betaTesters"
                  className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[14px] md:text-[15px] font-medium px-5 py-2.5 md:px-6 md:py-3 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
                >
                  베타 신청하기
                </a>
                <a
                  href="#demo"
                  className="bg-zinc-950/80 rounded-xl text-[14px] md:text-[15px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  위젯 미리보기 ↓
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-[12px] tracking-[0.2em] uppercase text-zinc-400 mb-10">
          Problem
        </p>
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {PAIN_POINTS.map((point, i) => (
            <li
              key={i}
              className="animate-fade-up flex items-start gap-5 py-6"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="text-[12px] font-mono text-zinc-300 dark:text-zinc-600 shrink-0 pt-[3px]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-[16px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {point}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-[12px] tracking-[0.2em] uppercase text-zinc-400 mb-10">
          How it works
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="animate-fade-up flex flex-col gap-3 pt-5 border-t border-zinc-200 dark:border-zinc-700"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="text-[12px] font-mono text-zinc-300 dark:text-zinc-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-[18px] font-semibold text-zinc-900 dark:text-zinc-100">
                {step.title}
              </h3>
              <p className="text-[16px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-[12px] tracking-[0.2em] uppercase text-zinc-400 mb-10">
          Features
        </p>
        <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {FEATURES.map((feat, i) => (
            <li
              key={i}
              className="animate-fade-up flex flex-col gap-1.5 py-6"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <h3 className="text-[18px] font-semibold text-zinc-900 dark:text-zinc-100">
                {feat.title}
              </h3>
              <p className="text-[16px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {feat.desc}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Widget Demo */}
      <section
        id="demo"
        className="max-w-4xl mx-auto px-6 py-20 border-t border-zinc-100 dark:border-zinc-800"
      >
        <p className="text-[12px] tracking-[0.2em] uppercase text-zinc-400 mb-4">
          Install
        </p>
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-8">
          스크립트 태그 하나면 끝.
        </h2>
        <div className="flex flex-col md:flex-row gap-8 md:items-start">
          <div className="animate-fade-up flex-1 bg-zinc-900 dark:bg-zinc-800 rounded-xl p-5 overflow-x-auto">
            <pre className="text-[12px] leading-relaxed text-zinc-300 font-mono whitespace-pre">{`<script
  src="https://cdn.kkoknote.com/widget.js"
  data-project-key="your-project-key"
  defer
></script>`}</pre>
          </div>
          <div
            className="animate-fade-up shrink-0 flex justify-center md:block"
            style={{ animationDelay: "100ms" }}
          >
            <WidgetMockup />
          </div>
        </div>
      </section>

      {/* Beta CTA */}
      <section className="border-t border-zinc-100 dark:border-zinc-800 py-24 flex justify-center px-6">
        <BetaSection
          hideFeatures={true}
          remainingPromise={Promise.resolve(25)}
        />
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
        <span className="text-[12px] text-zinc-300 dark:text-zinc-600">
          © 2026 KkokNote
        </span>
        <a
          href="mailto:hi@kkoknote.com"
          className="text-[12px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          문의하기
        </a>
      </footer>
    </main>
  );
}

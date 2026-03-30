export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6 py-16">
      <div className="w-full max-w-sm md:max-w-md flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-10 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 w-full rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="h-[46px] rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="h-[46px] rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <p className="text-[12px] text-zinc-300 dark:text-zinc-700 text-center pt-3">
            — / 50 자리 남음
          </p>
        </div>
      </div>
    </main>
  );
}

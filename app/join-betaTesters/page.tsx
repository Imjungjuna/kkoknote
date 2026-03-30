import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import BetaSection from "@/components/BetaSection";

const BETA_SLOTS = 50;

function getBetaRemainingPromise() {
  return cookies().then(async (cookieStore) => {
    const supabase = await createClient();
    const { count } = await supabase
      .from("beta_registrations")
      .select("*", { count: "exact", head: true });
    return Math.max(0, BETA_SLOTS - (count ?? 0));
  });
}

export default function JoinBetaPage() {
  const remainingPromise = getBetaRemainingPromise();
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6 py-16">
      <BetaSection remainingPromise={remainingPromise} />
    </main>
  );
}

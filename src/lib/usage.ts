import { createClient } from "@/lib/supabase/server";

export const FREE_TIER_AI_LIMIT = 50;

export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function checkAndIncrementUsage(
  userId: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const supabase = await createClient();
  const month = getCurrentMonth();

  // Check user tier
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single();

  // Pro users have unlimited AI processing
  if (profile?.tier === "pro") {
    await supabase
      .from("usage_limits")
      .upsert(
        { user_id: userId, month, ai_processing_count: 1 },
        { onConflict: "user_id,month" }
      );
    return { allowed: true, count: 0, limit: Infinity };
  }

  // Get current usage for free tier
  const { data: usage } = await supabase
    .from("usage_limits")
    .select("ai_processing_count")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  const currentCount = usage?.ai_processing_count ?? 0;

  if (currentCount >= FREE_TIER_AI_LIMIT) {
    return { allowed: false, count: currentCount, limit: FREE_TIER_AI_LIMIT };
  }

  // Increment usage
  await supabase
    .from("usage_limits")
    .upsert(
      { user_id: userId, month, ai_processing_count: currentCount + 1 },
      { onConflict: "user_id,month" }
    );

  return { allowed: true, count: currentCount + 1, limit: FREE_TIER_AI_LIMIT };
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SubscriptionRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings?activeTab=subscription");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  );
}

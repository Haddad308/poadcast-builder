"use client";

import dynamic from "next/dynamic";

const Page = dynamic(() => import("./index"), { ssr: false });

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/firebase/auth-context";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/landing");
    }
  }, [user, router]);

  if (!user) {
    return null; // Will redirect to landing page
  }

  return <Page />;
}

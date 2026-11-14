"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Atualizar({ ativo }: { ativo: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!ativo) return;
    const t = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(t);
  }, [ativo, router]);
  return null;
}

"use client";
import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  pendingLabel = "Forging…",
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className={`min-h-11 rounded bg-gold-500 px-4 font-display font-bold uppercase tracking-wider text-steel-950 transition active:translate-y-px active:brightness-90 disabled:opacity-80 ${pending ? "molten-pending" : ""} ${className}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

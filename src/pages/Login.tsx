import { useState } from "react";
import { useAuth } from "@/state/auth";

export function Login() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await signInWithEmail(email);
    if (error) {
      setStatus("error");
      setMessage(error);
    } else {
      setStatus("sent");
      setMessage("Check your inbox for a magic sign-in link.");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-vignette" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 spotlight" />

      <div className="card animate-fade-up relative w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/reel.svg" alt="" className="mb-3 h-14 w-14 animate-flicker" />
          <h1 className="display text-3xl tracking-marquee text-bone">
            Sur<span className="text-amber">reel</span>
          </h1>
          <p className="mt-2 text-sm text-bone-dim">
            Your cinematic record of every theater visit — and every dollar your
            membership saves.
          </p>
        </div>

        <button onClick={() => void signInWithGoogle()} className="btn-ghost mb-3 w-full">
          Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3 text-xs text-bone-faint">
          <span className="h-px flex-1 bg-white/10" />
          OR
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
          <button type="submit" disabled={status === "sending"} className="btn-primary w-full">
            {status === "sending" ? "Sending…" : "Email me a magic link"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              status === "error" ? "text-negative" : "text-positive"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

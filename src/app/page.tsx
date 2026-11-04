"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");

async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setMessage("");
  setLoading(true);

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Login failed.");
      return;
    }

    window.location.href = data.redirectTo;
  } catch (error) {
    console.error("Login error:", error);
    setMessage("Unable to connect to the server. Please try again.");
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5 md:p-8">

      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-surface shadow-xl md:grid-cols-2">

        {/* Left branding section */}
        <section className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-[#3B2D20] p-8 text-[#FFFCF8] md:min-h-[600px] md:p-12">

          <div className="relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6C45C]">
              <span className="text-2xl font-bold text-[#3B2D20]">W</span>
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-wide">
              WEIGHCONNECT
            </h1>

            <p className="mt-2 text-sm tracking-widest text-[#D9C7B4]">
              PLANT OPERATIONS MANAGEMENT
            </p>
          </div>

          <div className="relative z-10 mt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#F6C45C]">
              Welcome back
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
              Everything connected.
              <br />
              Every operation
              <br />
              under control.
            </h2>

            <p className="mt-5 max-w-sm text-sm leading-7 text-[#D9C7B4]">
              A centralized platform for plant transactions, weighbridge
              operations, reports and configuration management.
            </p>
          </div>

          {/* Decorative circles */}
          <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full border border-[#A78A6C]/30" />
          <div className="pointer-events-none absolute -bottom-12 -right-8 h-48 w-48 rounded-full border border-[#A78A6C]/30" />

          <p className="relative z-10 mt-12 text-xs text-[#BDAA96]">
            WeighConnect · Secure Plant Access
          </p>
        </section>

        {/* Right login section */}
        <section className="flex items-center justify-center p-8 md:p-12">

          <div className="w-full max-w-sm">

            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Account Access
              </p>

              <h2 className="mt-3 text-3xl font-bold text-foreground">
                Sign in
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                Enter your credentials to access WeighConnect.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-9 space-y-6">

             {/* Email Address */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-foreground"
                  >
                    Password
                  </label>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-border bg-background px-4 py-3.5 pr-16 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />                
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 accent-[#6F5038]"
                />

                <label
                  htmlFor="rememberMe"
                  className="ml-2 text-sm text-muted"
                >
                  Remember me
                </label>
              </div>

              {/* Sign in */}
               <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Signing In..." : "Sign In"}
                    </button>
              {message && (
                <p
                  role="status"
                  className="rounded-lg border border-border bg-background p-3 text-sm text-muted"
                >
                  {message}
                </p>
              )}

            </form>

            <div className="mt-10 border-t border-border pt-6 text-center">
              <p className="text-xs leading-5 text-muted">
                Authorized personnel only.
                <br />
                Contact your administrator if you need access.
              </p>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}


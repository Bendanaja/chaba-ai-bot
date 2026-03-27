"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.replace("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(-45deg, #D63384, #6C5CE7, #C8A951, #D63384)",
          backgroundSize: "400% 400%",
          animation: "gradientShift 15s ease infinite",
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${8 + (i % 5) * 6}px`,
              height: `${8 + (i % 5) * 6}px`,
              background: i % 2 === 0 ? "#FFF8F0" : "#C8A951",
              left: `${(i * 5.3) % 100}%`,
              bottom: "-20px",
              animation: `floatUp ${8 + (i % 7) * 3}s linear infinite`,
              animationDelay: `${(i * 0.7) % 10}s`,
            }}
          />
        ))}
      </div>

      {/* Login card with glassmorphism */}
      <Card
        className={`relative z-10 w-full max-w-sm border-0 shadow-2xl transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <CardHeader className="items-center gap-3 pb-2 pt-6">
          <div
            className="relative h-24 w-24 overflow-hidden rounded-full shadow-lg"
            style={{
              boxShadow: "0 0 30px rgba(214, 51, 132, 0.3)",
            }}
          >
            <Image
              src="/chaba-mascot.jpg"
              alt="Chaba Mascot"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="text-center">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #D63384, #C8A951, #D63384)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 3s linear infinite",
              }}
            >
              Chaba AI
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Admin Dashboard</p>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-9 pr-10 ${error ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive animate-[shake_0.5s_ease-in-out]">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D63384] to-[#6C5CE7] text-white hover:opacity-90 h-9 text-sm font-medium shadow-lg transition-all duration-300"
              style={{
                boxShadow: loading ? "none" : "0 4px 20px rgba(214, 51, 132, 0.3)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

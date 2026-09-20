import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  mockLoginAs,
  mockLoginWithCredentials,
} from "@/lib/mock-auth";
import {
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  UserX,
  GraduationCap,
  Building2,
  Briefcase,
  Terminal,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { UserRole } from "@/types";

// ─── Routing map ───
const ROLE_ROUTES: Record<UserRole, string> = {
  student: "/student/dashboard",
  tpo: "/tpo/dashboard",
  recruiter: "/company/dashboard",
};

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

// ─── Known credential hint ───
const CREDENTIAL_HINTS: Record<string, string> = {
  "student@college.edu.in": "Password: student123",
  "tpo@college.edu.in": "Password: tpo123",
  "admin@college.edu.in": "Password: admin123",
  "recruiter@company.com": "Password: recruiter123",
};

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);

  // ─── Convex mutations (for email OTP flow) ───
  const seedDb = useMutation(api.seed.seedDatabase);
  const setRole = useMutation(api.users.setUserRole);

  // ─── UI state ───
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Credential form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  // ─── 1-Click Demo Login ───
  const handleDemoLogin = async (role: UserRole) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = mockLoginAs(role);
      navigate(ROLE_ROUTES[user.role]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed.");
      setIsLoading(false);
    }
  };

  // ─── Standard Credential Login ───
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = mockLoginWithCredentials(email, password);

    if (!result.success) {
      setError(result.error ?? "Login failed.");
      setIsLoading(false);
      return;
    }

    navigate(ROLE_ROUTES[result.user!.role]);
  };

  // ─── Guest Login (Convex anonymous) ───
  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      try { await seedDb(); } catch { /* Already seeded */ }
      navigate(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guest login failed.");
      setIsLoading(false);
    }
  };

  // Convex signIn for guest fallback
  const { signIn } = useAuth();

  return (
    <div className="nb-scene min-h-screen flex flex-col bg-background">
      <div className="nb-noise" aria-hidden="true" />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="flex items-center justify-center h-full flex-col w-full max-w-md">
          <Card className="w-full border-2 border-border shadow-none">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div
                  className="w-14 h-14 border-2 border-border bg-primary/15 flex items-center justify-center cursor-pointer"
                  onClick={() => navigate("/")}
                >
                  <Terminal className="h-7 w-7 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black tracking-tight">
                Placement Portal
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to access your placement dashboard
              </p>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* ═══════════════════════════════════
                  SECTION 1 — 1-Click Demo Logins
                  ═══════════════════════════════════ */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Zap className="h-3 w-3" />
                  Quick Demo Access
                </p>

                {/* Single clean triad — one button per role, no duplicates.
                    Full-width responsive grid: stacked on mobile, 3-across on
                    larger screens, with comfortable padding and distinct
                    borders so labels never compress or overlap. */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                  <Button
                    type="button"
                    className="nb-btn-primary py-6 text-xs gap-2 w-full justify-center border border-purple-500/30 px-2 whitespace-nowrap"
                    onClick={() => handleDemoLogin("student")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <GraduationCap className="h-4 w-4 shrink-0" />
                    )}
                    Student (Aditya)
                  </Button>
                  <Button
                    type="button"
                    className="nb-btn-primary py-6 text-xs gap-2 w-full justify-center border border-purple-500/30 px-2 whitespace-nowrap"
                    onClick={() => handleDemoLogin("tpo")}
                    disabled={isLoading}
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    TPO (Dr. Srinivas)
                  </Button>
                  <Button
                    type="button"
                    className="nb-btn-primary py-6 text-xs gap-2 w-full justify-center border border-purple-500/30 px-2 whitespace-nowrap"
                    onClick={() => handleDemoLogin("recruiter")}
                    disabled={isLoading}
                  >
                    <Briefcase className="h-4 w-4 shrink-0" />
                    Recruiter (Google Cloud)
                  </Button>
                </div>
              </div>

              {/* ═══════════════════════════════════
                  Divider
                  ═══════════════════════════════════ */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full nb-divider" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-bold">
                    Or sign in with credentials
                  </span>
                </div>
              </div>

              {/* ═══════════════════════════════════
                  SECTION 2 — Email / Password Form
                  ═══════════════════════════════════ */}
              <form onSubmit={handleCredentialLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs uppercase">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="email"
                      placeholder="you@college.edu.in"
                      type="email"
                      className="pl-9 nb-input"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {email && CREDENTIAL_HINTS[email.toLowerCase()] && (
                    <p className="text-[10px] text-muted-foreground italic pl-1">
                      {CREDENTIAL_HINTS[email.toLowerCase()]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs uppercase">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="password"
                      placeholder="Enter your password"
                      type="password"
                      className="pl-9 nb-input"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="nb-card border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive font-bold">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full nb-btn-secondary"
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* ═══════════════════════════════════
                  SECTION 3 — Guest (Convex)
                  ═══════════════════════════════════ */}
              <Button
                type="button"
                variant="ghost"
                className="w-full border-2 border-border font-bold text-xs"
                onClick={handleGuestLogin}
                disabled={isLoading}
              >
                <UserX className="mr-2 h-4 w-4" />
                Continue as Guest
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}

import React, { useState } from "react";
import { ShieldCheck, User, Mail, Lock, Building2, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (user: any, token: string) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Logistics Coordinator");

  // Inline Google Simulation state
  const [showSimModal, setShowSimModal] = useState(false);
  const [simName, setSimName] = useState("");
  const [simEmail, setSimEmail] = useState("");
  const [simRole, setSimRole] = useState("Logistics Coordinator");
  const [isSimLoading, setIsSimLoading] = useState(false);

  const roles = [
    "Logistics Coordinator",
    "Warehouse Manager",
    "Inventory Controller",
    "System Administrator"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin 
      ? { email, password } 
      : { name, email, password, role };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      // Success
      localStorage.setItem("aether_auth_token", data.token);
      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Failed to connect to authentication server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "sarah@aether.io", password: "password123" })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }
      localStorage.setItem("aether_auth_token", data.token);
      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Demo login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        const { token, user } = event.data.payload;
        localStorage.setItem("aether_auth_token", token);
        onAuthSuccess(user, token);
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [onAuthSuccess]);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/google/url");
      if (!response.ok) {
        throw new Error("Failed to initialize Google authentication.");
      }
      const { url, isSimulated } = await response.json();
      
      if (isSimulated) {
        setSimName("Aether Operator");
        setSimEmail("operator@aether.io");
        setSimRole("Logistics Coordinator");
        setShowSimModal(true);
        setIsLoading(false);
        return;
      }

      const authWindow = window.open(
        url,
        "google_oauth_popup",
        "width=500,height=650"
      );

      if (!authWindow) {
        setError("Popup was blocked. Please enable popups in your browser to sign in with Google.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate Google sign-in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulatedGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimLoading(true);
    setError(null);
    try {
      const qParams = new URLSearchParams({
        code: "mock-google-code",
        name: simName,
        email: simEmail,
        role: simRole,
        json: "true"
      });
      const response = await fetch(`/auth/google/callback?${qParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed simulated Google authentication.");
      }
      const data = await response.json();
      localStorage.setItem("aether_auth_token", data.token);
      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Simulation login failed.");
    } finally {
      setIsSimLoading(false);
      setShowSimModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start sm:justify-center py-6 px-4 overflow-y-auto" id="auth-screen">
      {/* Background visual graphics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] rounded-full bg-emerald-500/10 blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-fade-in my-auto">
        {/* Core Header Panel */}
        <div className="p-5 md:p-6 text-center border-b border-slate-800/60 bg-gradient-to-b from-slate-900/60 via-slate-900 to-slate-900/40">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-3 shadow-inner">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-100 tracking-tight font-sans">
            AETHER LOGISTICS
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 font-mono tracking-wider uppercase">
            AI Inventory & Industrial Routing
          </p>
        </div>

        {/* Tab Controls */}
        <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/40">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`py-3 text-xs font-bold font-mono tracking-wider uppercase transition-all cursor-pointer border-b-2 ${
              isLogin 
                ? "border-indigo-500 text-indigo-400 bg-slate-900/20" 
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`py-3 text-xs font-bold font-mono tracking-wider uppercase transition-all cursor-pointer border-b-2 ${
              !isLogin 
                ? "border-indigo-500 text-indigo-400 bg-slate-900/20" 
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Register
          </button>
        </div>

        {/* Form Container */}
        <div className="p-5 md:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs font-medium leading-relaxed animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration specific: Full Name */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase block">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 text-sm font-medium transition-all outline-none"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase block">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@aether.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 text-sm font-medium transition-all outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase block">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-10 text-slate-200 placeholder-slate-600 text-sm font-medium transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Registration specific: Role Selection */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase block">
                  Assign System Role
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 text-sm font-medium transition-all outline-none appearance-none cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r} className="bg-slate-950 text-slate-200">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 text-slate-100 rounded-xl py-3 text-xs font-bold font-mono tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 active:scale-[0.98] mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? "Access Terminal" : "Register Credentials"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-mono uppercase">Or connect with</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl py-3 text-xs font-bold font-mono tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{isLogin ? "Sign In with Google" : "Register with Google"}</span>
            </button>
          </form>

          {/* Quick Demo Assist Login Button (helpful for seamless user evaluations!) */}
          {isLogin && (
            <div className="pt-4 border-t border-slate-800/50 text-center">
              <span className="text-[10px] text-slate-500 font-mono uppercase block mb-2.5">
                Quick Demo Access (Kiosk Mode)
              </span>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700/60 rounded-lg text-[11px] text-slate-300 font-bold font-mono uppercase transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>Log in as Sarah Jenkins</span>
              </button>
              <div className="text-[10px] text-slate-500 mt-2 font-mono">
                Email: <span className="text-slate-400">sarah@aether.io</span> • Password: <span className="text-slate-400">password123</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Google Accounts Simulation Inline Modal */}
      {showSimModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Visual Color Accent (Google-like bar) */}
            <div className="absolute top-0 inset-x-0 h-[4px] bg-gradient-to-r from-red-500 via-blue-500 to-green-500"></div>

            {/* Header */}
            <div className="text-center pb-5 border-b border-slate-800/60">
              <div className="inline-flex items-center justify-center gap-2 mb-3">
                <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="font-extrabold text-slate-100 tracking-tight text-lg">Google Accounts</span>
              </div>
              <h2 className="text-sm font-bold text-slate-200">Choose simulated account</h2>
              <p className="text-[11px] text-slate-400 mt-1">
                to sign in and connect to <span className="text-indigo-400 font-extrabold">Aether Logistics</span>
              </p>
            </div>

            {/* Sandbox Notice Banner */}
            <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex gap-2.5">
              <span className="text-indigo-400 text-sm">💡</span>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-indigo-300">Sandbox Simulation Active:</strong> Because <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded text-[9px] font-mono">GOOGLE_CLIENT_ID</code> is not defined, we are logging you in with an elegant instant Google credential generator.
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSimulatedGoogleSubmit} className="space-y-4 mt-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase block">
                  Simulated Account Name
                </label>
                <input
                  type="text"
                  required
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-3 text-slate-200 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase block">
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-3 text-slate-200 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase block">
                  Select System Role
                </label>
                <select
                  value={simRole}
                  onChange={(e) => setSimRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-3 text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none"
                >
                  {roles.map((r) => (
                    <option key={r} value={r} className="bg-slate-950 text-slate-200">{r}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-700/50 uppercase tracking-wider font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSimLoading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 uppercase tracking-wider font-mono flex items-center justify-center gap-1.5"
                >
                  {isSimLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import FireflyLogo from "../components/FireflyLogo";

function getErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;

  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const obj = data as { message?: string; title?: string };
    if (typeof obj.message === "string" && obj.message.trim())
      return obj.message;
    if (typeof obj.title === "string" && obj.title.trim()) return obj.title;
  }

  return fallback;
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [capsLockOn, setCapsLockOn] = useState(false);

  const navigate = useNavigate();

  const isBusy = isLoggingIn || isUpdatingPassword;

  const handleCapsLockCheck = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;

    setError("");
    setIsLoggingIn(true);

    try {
      const response = await api.post("/Auth/login", { username, password });

      if (response?.data?.mustChangePassword) {
        setIsChangingPassword(true);
        return;
      }

      if (response?.data?.token) {
        localStorage.setItem("token", response.data.token);
      }
      if (response?.data?.role) {
        localStorage.setItem("role", response.data.role);
      }
      if (response?.data?.userName) {
        localStorage.setItem("userName", response.data.userName);
      }
      if (response?.data?.employeeId) {
        localStorage.setItem("employeeId", response.data.employeeId);
      }
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Invalid username or password."));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePasswordChangeSubmit = async () => {
    if (isUpdatingPassword) return;

    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await api.post("/Auth/change-password", {
        username,
        currentPassword: password,
        newPassword,
      });

      const response = await api.post("/Auth/login", {
        username,
        password: newPassword,
      });

      if (response?.data?.token) {
        localStorage.setItem("token", response.data.token);
      }
      if (response?.data?.role) {
        localStorage.setItem("role", response.data.role);
      }
      if (response?.data?.userName) {
        localStorage.setItem("userName", response.data.userName);
      }
      if (response?.data?.employeeId) {
        localStorage.setItem("employeeId", response.data.employeeId);
      }
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update password."));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleBackToLogin = () => {
    if (isBusy) return;
    setIsChangingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center p-4 sm:p-6 bg-(--bg-main)">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-(--border-color) bg-(--surface) p-6 shadow-xl sm:p-8 transition-all">
        {/* Logo and Subtitle inside the block */}
        <div className="flex flex-col items-center text-center space-y-2 pb-3 border-b border-slate-100">
          <div className="w-40 h-16 sm:w-72 sm:h-28 flex items-center justify-center transition-all">
            <FireflyLogo className="h-full w-full object-contain" />
          </div>
          <p className="text-[10px] font-bold tracking-widest text-(--text-muted) uppercase">
            Management Suite Portal
          </p>
        </div>

        <div className="space-y-1 text-left">
          <h2 className="text-lg font-bold text-(--text-main)">
            {isChangingPassword ? "Security Update Required" : "Welcome Back"}
          </h2>
          <p className="text-xs text-(--text-muted)">
            {isChangingPassword
              ? "Please create a new secure password before proceeding."
              : "Sign in to your account to continue"}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-medium text-rose-700"
          >
            {error}
          </div>
        )}

        {capsLockOn && !error && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-center text-xs font-medium text-amber-800"
          >
            <AlertTriangle size={14} className="shrink-0 text-amber-600" />
            Caps Lock is on
          </div>
        )}

        {!isChangingPassword ? (
          <div
            className="space-y-4"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isBusy) {
                e.preventDefault();
                handleLogin();
              }
            }}
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-(--text-muted)"
                >
                  Username
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User size={16} />
                  </span>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={isLoggingIn}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoFocus
                    className="block w-full rounded-xl border border-(--border-color) bg-slate-50/50 py-3.5 pl-10 pr-4 text-sm text-(--text-main) placeholder-slate-400 transition-all focus:border-(--primary) focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-(--text-muted)"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    onKeyUp={handleCapsLockCheck}
                    onKeyDown={handleCapsLockCheck}
                    disabled={isLoggingIn}
                    autoComplete="current-password"
                    className="block w-full rounded-xl border border-(--border-color) bg-slate-50/50 py-3.5 pl-10 pr-12 text-sm text-(--text-main) placeholder-slate-400 transition-all focus:border-(--primary) focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoggingIn}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none disabled:pointer-events-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoggingIn}
                aria-busy={isLoggingIn}
                className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--primary) px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-(--primary-hover) active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingIn && (
                  <Loader2 size={16} className="animate-spin text-white" />
                )}
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </div>
        ) : (
          <div
            className="space-y-4"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isBusy) {
                e.preventDefault();
                handlePasswordChangeSubmit();
              }
            }}
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-(--text-muted)"
                >
                  New Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <KeyRound size={16} />
                  </span>
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError("");
                    }}
                    onKeyUp={handleCapsLockCheck}
                    onKeyDown={handleCapsLockCheck}
                    disabled={isUpdatingPassword}
                    autoComplete="new-password"
                    autoFocus
                    className="block w-full rounded-xl border border-(--border-color) bg-slate-50/50 py-3.5 pl-10 pr-12 text-sm text-(--text-main) placeholder-slate-400 transition-all focus:border-(--primary) focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isUpdatingPassword}
                    aria-label={
                      showNewPassword
                        ? "Hide new password"
                        : "Show new password"
                    }
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none disabled:pointer-events-none cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-(--text-muted)"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <KeyRound size={16} />
                  </span>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError("");
                    }}
                    onKeyUp={handleCapsLockCheck}
                    onKeyDown={handleCapsLockCheck}
                    disabled={isUpdatingPassword}
                    autoComplete="new-password"
                    className="block w-full rounded-xl border border-(--border-color) bg-slate-50/50 py-3.5 pl-10 pr-12 text-sm text-(--text-main) placeholder-slate-400 transition-all focus:border-(--primary) focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isUpdatingPassword}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmed password"
                        : "Show confirmed password"
                    }
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none disabled:pointer-events-none cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePasswordChangeSubmit}
                disabled={isUpdatingPassword}
                aria-busy={isUpdatingPassword}
                className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--primary) px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-(--primary-hover) active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdatingPassword && (
                  <Loader2 size={16} className="animate-spin text-white" />
                )}
                {isUpdatingPassword
                  ? "Updating password..."
                  : "Update Password & Continue"}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                disabled={isBusy}
                className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-semibold text-(--text-muted) hover:text-(--primary) transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

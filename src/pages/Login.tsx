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

// ASP.NET Core error responses can show up as a plain string, a
// ProblemDetails object ({ title }), or a model-validation object
// ({ message }). Normalize all of them to a safe, displayable string.
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

  // Loading states — kept separate so each screen's button only
  // shows a spinner for the request it actually triggered.
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Show/Hide Password States
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setError("");
    setIsLoggingIn(true);

    try {
      const response = await api.post("/Auth/login", { username, password });

      if (response.data.mustChangePassword) {
        setIsChangingPassword(true);
        return;
      }

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      if (response.data.userName) {
        localStorage.setItem("userName", response.data.userName);
      }
      if (response.data.employeeId) {
        localStorage.setItem("employeeId", response.data.employeeId);
      }
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Invalid username or password."));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      if (response.data.userName) {
        localStorage.setItem("userName", response.data.userName);
      }
      if (response.data.employeeId) {
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
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-4 antialiased sm:p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-10">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-xs">
            F
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Firefly Crafts HRIS
          </h2>
          <p className="text-xs text-slate-500">
            {isChangingPassword
              ? "Security update required"
              : "Sign in to your account"}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-center text-xs font-medium text-rose-700"
          >
            {error}
          </div>
        )}

        {capsLockOn && !error && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-center text-xs font-medium text-amber-800"
          >
            <AlertTriangle size={14} className="shrink-0" />
            Caps Lock is on
          </div>
        )}

        {!isChangingPassword ? (
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <fieldset disabled={isLoggingIn} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="mb-1 block text-xs font-medium text-slate-700"
                >
                  Username
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
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
                    autoComplete="username"
                    autoCapitalize="none"
                    autoFocus
                    className="block w-full rounded-lg border border-slate-300 py-3 pl-9 pr-3 text-base focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 sm:py-2.5 sm:text-sm"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-xs font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
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
                    autoComplete="current-password"
                    className="block w-full rounded-lg border border-slate-300 py-3 pl-9 pr-10 text-base focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 sm:py-2.5 sm:text-sm"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoggingIn}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-hidden disabled:pointer-events-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                aria-busy={isLoggingIn}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-xs transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 sm:py-2.5"
              >
                {isLoggingIn && <Loader2 size={16} className="animate-spin" />}
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </button>
            </fieldset>
          </form>
        ) : (
          <form
            onSubmit={handlePasswordChangeSubmit}
            className="space-y-4"
            noValidate
          >
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              You are using a temporary password. Please create a new secure
              password before proceeding.
            </div>

            <fieldset disabled={isUpdatingPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-1 block text-xs font-medium text-slate-700"
                >
                  New Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
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
                    autoComplete="new-password"
                    autoFocus
                    className="block w-full rounded-lg border border-slate-300 py-3 pl-9 pr-10 text-base focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 sm:py-2.5 sm:text-sm"
                    placeholder="Enter new password"
                    required
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
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-hidden disabled:pointer-events-none"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-xs font-medium text-slate-700"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
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
                    autoComplete="new-password"
                    className="block w-full rounded-lg border border-slate-300 py-3 pl-9 pr-10 text-base focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 sm:py-2.5 sm:text-sm"
                    placeholder="Confirm new password"
                    required
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
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-hidden disabled:pointer-events-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                aria-busy={isUpdatingPassword}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-xs transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 sm:py-2.5"
              >
                {isUpdatingPassword && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {isUpdatingPassword
                  ? "Updating password..."
                  : "Update Password & Continue"}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex w-full items-center justify-center gap-1.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-50"
              >
                <ArrowLeft size={13} />
                Back to sign in
              </button>
            </fieldset>
          </form>
        )}
      </div>
    </div>
  );
}

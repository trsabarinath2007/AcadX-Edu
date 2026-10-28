import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(`/${user.role}-dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white">
            <GraduationCap size={28} />
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">Welcome to AcadX</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in with your institution account.</p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">Email</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-emerald-500">
              <Mail size={16} className="text-slate-400" />
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="you@acadx.edu" />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">Password</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-emerald-500">
              <LockKeyhole size={16} className="text-slate-400" />
              <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full bg-transparent text-sm outline-none" placeholder="Your password" />
            </div>
          </label>

          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</div>}

          <button disabled={loading} className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-xs text-emerald-900">
          <p className="font-bold">Demo accounts</p>
          <p className="mt-1">admin@acadx.edu / Admin@123</p>
          <p>faculty@acadx.edu / Faculty@123</p>
          <p>student@acadx.edu / Student@123</p>
        </div>
      </div>
    </div>
  );
}

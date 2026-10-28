import React, { useState } from "react";
import GenericPage from "./GenericPage";
import { apiPatch } from "../api";

export default function Settings() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  async function changePassword(e) {
    e.preventDefault();
    try { const r = await apiPatch("/users/password", form); setMessage(r.message); setForm({ currentPassword:"", newPassword:"" }); }
    catch (e) { setMessage(e.response?.data?.message || "Unable to change password"); }
  }
  return <GenericPage title="Settings" description="Manage your account and security settings.">
    <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-extrabold">Change Password</h2><form onSubmit={changePassword} className="mt-4 space-y-3"><input required type="password" value={form.currentPassword} onChange={e => setForm({...form,currentPassword:e.target.value})} placeholder="Current password" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><input required minLength={6} type="password" value={form.newPassword} onChange={e => setForm({...form,newPassword:e.target.value})} placeholder="New password" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><button className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white">Update password</button></form>{message && <p className="mt-3 text-xs font-semibold text-emerald-700">{message}</p>}</div>
  </GenericPage>;
}

import { Leaf } from 'lucide-react';
import { useState } from 'react';
import { useProfile } from '../context/ProfileContext';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { login, register } = useProfile();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setError('');
    setSuccess('');
  };

  const switchMode = (next: Mode) => {
    resetForm();
    setMode(next);
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setSuccess('');

    if (!username.trim()) return setError('Username tidak boleh kosong.');
    if (username.length < 3) return setError('Username minimal 3 karakter.');
    if (password.length < 6) return setError('Password minimal 6 karakter.');
    if (password !== confirmPassword) return setError('Konfirmasi password tidak cocok.');

    setLoading(true);
    try {
      await register(email, password, username.trim());
      setSuccess('Akun berhasil dibuat! Silakan cek email untuk verifikasi, lalu masuk.');
      switchMode('login');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#edf5ee] flex items-center justify-center p-6">
      <div className="bg-white border border-[#dbe7dc] rounded-3xl shadow-lg max-w-md w-full px-8 py-10 text-center">

        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-[#2fd57f] flex items-center justify-center mx-auto mb-6 shadow-md shadow-[#8bd9b0]/40">
          <Leaf size={32} className="text-[#113b2a]" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-[#0f4732] mb-2">
          TRASH<span className="text-[#0f7b53]">FORM</span>
        </h1>
        <p className="text-[13px] text-[#60766a] mb-6 leading-relaxed">
          Platform komunitas upcycling & daur ulang.
        </p>

        {/* Toggle Login / Register */}
        <div className="flex bg-[#edf5ee] rounded-2xl p-1 mb-6">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
                mode === m
                  ? 'bg-white text-[#0f4732] shadow-sm'
                  : 'text-[#60766a] hover:text-[#0f4732]'
              }`}
            >
              {m === 'login' ? 'Masuk' : 'Daftar'}
            </button>
          ))}
        </div>

        {/* Success message */}
        {success && (
          <div className="bg-[#e6f9f0] border border-[#a8e6c6] rounded-2xl px-4 py-3 mb-4">
            <p className="text-[#0f6b3f] text-[13px]">{success}</p>
          </div>
        )}

        {/* Form Fields */}
        <div className="flex flex-col gap-3">
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#dbe7dc] text-[14px] outline-none focus:border-[#2fd57f]"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-[#dbe7dc] text-[14px] outline-none focus:border-[#2fd57f]"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-[#dbe7dc] text-[14px] outline-none focus:border-[#2fd57f]"
          />

          {mode === 'register' && (
            <input
              type="password"
              placeholder="Konfirmasi Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#dbe7dc] text-[14px] outline-none focus:border-[#2fd57f]"
            />
          )}
        </div>

        {error && <p className="text-red-500 text-[13px] mt-3 mb-1">{error}</p>}

        <button
          type="button"
          onClick={mode === 'login' ? handleLogin : handleRegister}
          disabled={loading}
          className="w-full mt-5 py-3 rounded-2xl bg-[#2fd57f] text-[#113b2a] text-[14px] font-semibold hover:bg-[#29c572] transition-colors shadow-md shadow-[#8bd9b0]/50 disabled:opacity-50"
        >
          {loading
            ? mode === 'login' ? 'Masuk...' : 'Mendaftar...'
            : mode === 'login' ? 'Masuk' : 'Buat Akun'}
        </button>
      </div>
    </div>
  );
}
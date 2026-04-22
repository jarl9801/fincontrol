import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Briefcase } from 'lucide-react';

const Login = () => {
 const [loginData, setLoginData] = useState({ email: '', password: '' });
 const [loginError, setLoginError] = useState('');
 const [loading, setLoading] = useState(false);

 const handleLogin = async (e) => {
 e.preventDefault();
 setLoginError('');
 setLoading(true);
 try {
 await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
 } catch (error) {
 if (error.code === 'auth/network-request-failed') {
 setLoginError('Error de conexión. Verifica tu internet.');
 } else if (error.code === 'auth/too-many-requests') {
 setLoginError('Demasiados intentos. Intenta de nuevo más tarde.');
 } else {
 setLoginError('Email o contraseña incorrectos');
 }
 } finally {
 setLoading(false);
 }
 };

 return (
<div className="min-h-screen bg-[var(--black)] text-[var(--text-primary)]">
<div className="mx-auto flex min-h-screen w-full max-w-[1240px]">
<section className="dot-grid-subtle hidden flex-1 flex-col justify-between border-r border-[var(--border)] p-10 lg:flex">
<div>
<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md border border-[var(--border-visible)] bg-[var(--surface)]">
<Briefcase size={20} className="text-[var(--text-display)]" />
</div>
<p className="nd-label text-[var(--text-secondary)]">Secure access</p>
<h1 className="mt-3 nd-display text-[44px] leading-[1] tracking-[-0.03em] text-[var(--text-display)]">
FINCONTROL
</h1>
<p className="mt-4 max-w-[420px] text-[15px] leading-7 text-[var(--text-secondary)]">
Plataforma financiera para operación diaria, control de caja y seguimiento de cuentas por cobrar y pagar.
</p>
</div>

<div className="space-y-4">
<div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
<p className="nd-label text-[var(--text-secondary)]">Entorno</p>
<p className="mt-1 nd-mono text-[14px] text-[var(--text-display)]">UMTELKOMD GmbH</p>
</div>
<div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
<p className="nd-label text-[var(--text-secondary)]">Modo</p>
<p className="mt-1 nd-mono text-[14px] text-[var(--text-display)]">Finance Operations Console</p>
</div>
</div>
</section>

<section className="flex flex-1 items-center justify-center p-4 sm:p-8">
<div className="w-full max-w-md rounded-md border border-[var(--border-visible)] bg-[var(--surface)] p-8">
<div className="mb-8 flex flex-col items-center gap-3 text-center">
<div className="flex h-14 w-14 items-center justify-center rounded-md border border-[var(--border-visible)] bg-[var(--black)]">
<Briefcase size={24} className="text-[var(--text-primary)]" />
</div>
<div>
<h2 className="nd-display text-[28px] tracking-[-0.02em] text-[var(--text-display)]">Acceso</h2>
<p className="mt-1 nd-label text-[var(--text-disabled)]">UMTELKOMD Financial System</p>
</div>
</div>

<form onSubmit={handleLogin} className="space-y-4">
<div>
<label htmlFor="email" className="mb-2 block nd-label text-[var(--text-secondary)]">Email</label>
<input
id="email"
type="email"
required
className="w-full rounded-md border border-[var(--border-visible)] bg-transparent px-4 py-3 nd-mono text-sm text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none placeholder-[var(--text-tertiary)]"
value={loginData.email}
onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
placeholder="usuario@umtelkomd.com"
/>
</div>

<div>
<label htmlFor="password" className="mb-2 block nd-label text-[var(--text-secondary)]">Contraseña</label>
<input
id="password"
type="password"
required
className="w-full rounded-md border border-[var(--border-visible)] bg-transparent px-4 py-3 nd-mono text-sm text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none placeholder-[var(--text-tertiary)]"
value={loginData.password}
onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
placeholder="********"
/>
</div>

{loginError && (
<div className="rounded-md border border-[var(--accent)] px-4 py-3 nd-mono text-[12px] text-[var(--accent)]">
[ERROR] {loginError}
</div>
)}

<button
type="submit"
disabled={loading}
className={`w-full rounded-full bg-[var(--text-primary)] py-3 nd-mono text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--black)] transition-opacity ${loading ? 'cursor-not-allowed opacity-50' : 'hover:opacity-85'}`}
>
{loading ? '[Loading...]' : 'Iniciar Sesión'}
</button>
</form>

<p className="mt-6 text-center nd-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-disabled)]">
Sistema de Gestión Financiera {new Date().getFullYear()}
</p>
</div>
</section>
</div>
</div>
 );
};

export default Login;

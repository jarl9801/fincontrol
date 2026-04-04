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
 <div className="flex h-screen bg-[var(--black)] items-center justify-center p-4 dot-grid-subtle">
 <div className="bg-[var(--surface)] rounded-xl w-full max-w-sm p-8 border border-[var(--border-visible)]">
 <div className="flex flex-col items-center gap-3 mb-8">
 <div className="w-14 h-14 border border-[var(--border-visible)] rounded-xl flex items-center justify-center bg-[var(--black)]">
 <Briefcase size={28} className="text-[var(--text-primary)]" />
 </div>
 <div className="text-center">
 <h1 className="font-[Space_Mono] text-xl font-bold uppercase tracking-[0.08em] text-[var(--text-display)]">UMTELKOMD</h1>
 <p className="font-[Space_Mono] text-[11px] uppercase tracking-[0.12em] text-[var(--text-disabled)] mt-1">Sistema Financiero</p>
 </div>
 </div>

 <form onSubmit={handleLogin} className="space-y-4">
 <div>
 <label htmlFor="email" className="block font-[Space_Mono] text-[11px] uppercase tracking-[0.08em] text-[var(--text-secondary)] mb-2">Email</label>
 <input
 id="email"
 type="email"
 required
 className="w-full px-4 py-3 bg-transparent text-[var(--text-primary)] border border-[var(--border-visible)] rounded-lg font-[Space_Mono] text-sm focus:border-[var(--text-primary)] focus:outline-none placeholder-[#444]"
 value={loginData.email}
 onChange={(e) => setLoginData({...loginData, email: e.target.value})}
 placeholder="usuario@umtelkomd.com"
 />
 </div>

 <div>
 <label htmlFor="password" className="block font-[Space_Mono] text-[11px] uppercase tracking-[0.08em] text-[var(--text-secondary)] mb-2">Contraseña</label>
 <input
 id="password"
 type="password"
 required
 className="w-full px-4 py-3 bg-transparent text-[var(--text-primary)] border border-[var(--border-visible)] rounded-lg font-[Space_Mono] text-sm focus:border-[var(--text-primary)] focus:outline-none placeholder-[#444]"
 value={loginData.password}
 onChange={(e) => setLoginData({...loginData, password: e.target.value})}
 placeholder="********"
 />
 </div>

 {loginError && (
 <div className="border border-[var(--accent)] text-[var(--accent)] px-4 py-3 rounded-lg font-[Space_Mono] text-[12px]">
 [ERROR] {loginError}
 </div>
 )}

 <button
 type="submit"
 disabled={loading}
 className={`w-full bg-[var(--text-primary)] text-[var(--black)] font-[Space_Mono] font-bold uppercase tracking-[0.06em] py-3 rounded-full text-[13px] transition-opacity ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-85'}`}
 >
 {loading ? '[Loading...]' : 'Iniciar Sesión'}
 </button>
 </form>

 <p className="font-[Space_Mono] text-[10px] uppercase tracking-[0.08em] text-[var(--text-disabled)] text-center mt-6">
 Sistema de Gestión Financiera {new Date().getFullYear()}
 </p>
 </div>
 </div>
 );
};

export default Login;

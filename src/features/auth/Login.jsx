import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Briefcase } from 'lucide-react';

const Login = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
    } catch (error) {
      setLoginError('Email o contraseña incorrectos');
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center p-4">
      <div className="bg-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-3 text-blue-600 mb-8">
          <Briefcase size={40} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">UMTELKOMD</h1>
            <p className="text-sm text-[#8888b0]">Sistema Financiero</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-[#3a3a5a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={loginData.email}
              onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              placeholder="usuario@umtelkomd.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">Contraseña</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 border border-[#3a3a5a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              placeholder="********"
            />
          </div>

          {loginError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
          >
            Iniciar Sesión
          </button>
        </form>

        <p className="text-xs text-[#6868a0] text-center mt-6">
          Sistema de Gestión Financiera 2025
        </p>
      </div>
    </div>
  );
};

export default Login;

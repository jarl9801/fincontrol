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
    <div className="flex h-screen bg-[#000000] items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-3 text-[#60a5fa] mb-8">
          <Briefcase size={40} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">UMTELKOMD</h1>
            <p className="text-sm text-[#8e8e93]">Sistema Financiero</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#c7c7cc] mb-2">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-[#2c2c2e] text-[#ffffff] border border-[rgba(255,255,255,0.14)] rounded-lg focus:ring-2 focus:ring-[#00C853] focus:border-transparent outline-none placeholder-[#636366]"
              value={loginData.email}
              onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              placeholder="usuario@umtelkomd.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#c7c7cc] mb-2">Contraseña</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-[#2c2c2e] text-[#ffffff] border border-[rgba(255,255,255,0.14)] rounded-lg focus:ring-2 focus:ring-[#00C853] focus:border-transparent outline-none placeholder-[#636366]"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              placeholder="********"
            />
          </div>

          {loginError && (
            <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] text-[#f87171] px-4 py-3 rounded-lg text-sm">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#00C853] hover:bg-[#00b348] text-white font-bold py-3 rounded-lg transition-colors shadow-md"
          >
            Iniciar Sesión
          </button>
        </form>

        <p className="text-xs text-[#636366] text-center mt-6">
          Sistema de Gestión Financiera 2025
        </p>
      </div>
    </div>
  );
};

export default Login;

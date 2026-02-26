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
    <div className="flex h-screen bg-black items-center justify-center p-4">
      <div className="bg-[rgba(28,28,30,0.8)] backdrop-blur-xl rounded-2xl w-full max-w-sm p-8 border border-[rgba(255,255,255,0.08)]" style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#30d158] to-[#0a84ff] rounded-2xl flex items-center justify-center" style={{ boxShadow: '0 4px 16px rgba(48, 209, 88, 0.3)' }}>
            <Briefcase size={28} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-white">UMTELKOMD</h1>
            <p className="text-[12px] text-[#8e8e93] mt-0.5">Sistema Financiero</p>
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
            <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] text-[#ff453a] px-4 py-3 rounded-lg text-sm">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#30d158] hover:bg-[#28c74e] text-white font-semibold py-3 rounded-xl text-[14px] transition-all"
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

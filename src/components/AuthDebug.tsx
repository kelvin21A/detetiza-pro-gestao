import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const AuthDebug: React.FC = () => {
  const { user, userProfile, loading, session } = useAuth();

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8" style={{ minHeight: '100dvh' }}>
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-black mb-8">🔍 Debug de Autenticação</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Status de Loading */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-black mb-4">Status de Carregamento</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? '✅ Sim' : '❌ Não'}</p>
              <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* Dados do Usuário */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-black mb-4">Usuário (Auth)</h2>
            <div className="space-y-2">
              <p><strong>Existe:</strong> {user ? '✅ Sim' : '❌ Não'}</p>
              {user && (
                <>
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                </>
              )}
            </div>
          </div>

          {/* Perfil do Usuário */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-black mb-4">Perfil do Usuário</h2>
            <div className="space-y-2">
              <p><strong>Existe:</strong> {userProfile ? '✅ Sim' : '❌ Não'}</p>
              {userProfile && (
                <>
                  <p><strong>Nome:</strong> {userProfile.full_name}</p>
                  <p><strong>Role:</strong> {userProfile.role}</p>
                  <p><strong>Org ID:</strong> {userProfile.organization_id}</p>
                  <p><strong>Ativo:</strong> {userProfile.active ? '✅ Sim' : '❌ Não'}</p>
                  <p><strong>Super Admin:</strong> {userProfile.is_super_admin ? '✅ Sim' : '❌ Não'}</p>
                </>
              )}
            </div>
          </div>

          {/* Sessão Supabase */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-black mb-4">Sessão Supabase</h2>
            <div className="space-y-2">
              <p><strong>Existe:</strong> {session ? '✅ Sim' : '❌ Não'}</p>
              {session && (
                <>
                  <p><strong>Access Token:</strong> {session.access_token ? '✅ Existe' : '❌ Não existe'}</p>
                  <p><strong>Expires At:</strong> {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dados Completos (JSON) */}
        <div className="mt-6 sm:mt-8 bg-gray-50 p-4 sm:p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-black mb-4">Dados Completos (JSON)</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-black">User:</h3>
              <pre className="bg-white p-3 rounded text-xs overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-black">UserProfile:</h3>
              <pre className="bg-white p-3 rounded text-xs overflow-auto">
                {JSON.stringify(userProfile, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Teste de Login */}
        <div className="mt-6 sm:mt-8 bg-red-50 p-4 sm:p-6 rounded-lg border border-red-200">
          <h2 className="text-xl font-semibold text-red-800 mb-4">🧪 Teste de Login</h2>
          <p className="text-red-700 mb-4">
            Se você está vendo esta tela, significa que o AuthContext está funcionando parcialmente.
          </p>
          <div className="space-y-2 text-sm">
            <p><strong>Próximos passos:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-red-700">
              <li>Verifique se as credenciais teste@teste / 123456 funcionam</li>
              <li>Verifique se há erros no console do navegador</li>
              <li>Verifique se a configuração do Supabase está correta</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;

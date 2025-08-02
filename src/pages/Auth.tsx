import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      // Se for super admin, redirecionar para painel super admin
      if (user.is_super_admin || user.role === 'super_admin') {
        navigate('/super-admin');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    
    if (!email || !password) {
      setLoginError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }
    
    const { error } = await signIn(email, password);
    
    if (error) {
      const errorMessage = error.message === 'Invalid login credentials' 
        ? 'Credenciais inválidas. Verifique seu email e senha.' 
        : error.message;
      setLoginError(errorMessage);
      toast.error(errorMessage);
    } else {
      toast.success('Login realizado com sucesso!');
      // Navegação será feita pelo useEffect acima
    }
    
    setLoading(false);
  };

  const useTestCredentials = () => {
    setEmail('teste@teste');
    setPassword('123456');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <ClipboardList className="h-16 w-16 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-black mb-2">DetetizaPro</h1>
          <p className="text-gray-600">Sistema de Gestão para Empresas de Dedetização</p>
        </div>

        {/* Card de Login */}
        <Card className="border border-gray-200 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-black">Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mensagem de Erro */}
            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 text-center">{loginError}</p>
              </div>
            )}

            {/* Formulário de Login */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Campo Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black font-medium">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500 h-12"
                  required
                />
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-gray-300 focus:border-red-500 focus:ring-red-500 h-12 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão Entrar */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {/* Botão de Teste (apenas desenvolvimento) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Button 
                  onClick={useTestCredentials}
                  variant="outline" 
                  className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                  type="button"
                >
                  Usar Credenciais de Teste
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            2024 DetetizaPro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
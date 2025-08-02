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

  // Função para usar credenciais de teste (apenas desenvolvimento)
  const useTestCredentials = () => {
    setEmail('teste@teste');
    setPassword('123456');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    
    if (error) {
      toast({
        title: 'Erro no cadastro',
        description: error.message === 'User already registered' 
          ? 'Este email já está cadastrado' 
          : error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Cadastro realizado!',
        description: 'Verifique seu email para confirmar a conta'
      });
    }
    
    setLoading(false);
  };

  const handleTestLogin = async () => {
    setLoading(true);
    
    const { error } = await testLogin();
    
    if (error) {
      toast({
        title: 'Erro no login de teste',
        description: 'Não foi possível fazer login de teste',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Login de teste realizado!',
        description: 'Bem-vindo ao DetetizaPro (modo teste)'
      });
      navigate('/');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">DetetizaPro</h1>
          </div>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Entrar na sua conta</CardTitle>
                <CardDescription>
                  Digite suas credenciais para acessar o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Criar nova conta</CardTitle>
                <CardDescription>
                  Preencha os dados para criar sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organization-name">Nome da empresa</Label>
                    <Input
                      id="organization-name"
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="Nome da sua empresa"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Digite uma senha"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar conta
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Test Login Section for Development */}
        <div className="mt-6">
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Desenvolvimento</CardTitle>
              <CardDescription className="text-xs">
                Login de teste para acessar o sistema sem configurar Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleTestLogin}
                variant="outline" 
                className="w-full" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                🧪 Login de Teste
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Usuário: Administrador Teste<br />
                Email: teste@detetizapro.com
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
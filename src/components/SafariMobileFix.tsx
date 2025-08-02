import React, { useEffect, useState } from 'react';

const SafariMobileFix: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSafariMobile, setIsSafariMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Detectar Safari mobile
    const userAgent = navigator.userAgent;
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isMobile = /iPhone|iPad|iPod/.test(userAgent);
    
    setIsSafariMobile(isSafari && isMobile);
    
    // Forçar re-render após um pequeno delay para Safari
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Tela de loading específica para Safari mobile
  if (isSafariMobile && !isLoaded) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
          padding: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#FF0000',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}
          >
            <div 
              style={{
                width: '20px',
                height: '20px',
                border: '3px solid #FFFFFF',
                borderTop: '3px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
          </div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#000000', 
            marginBottom: '10px' 
          }}>
            DetetizaPro
          </h1>
          <p style={{ 
            color: '#666666', 
            fontSize: '16px',
            marginBottom: '20px'
          }}>
            Carregando sistema...
          </p>
          <p style={{ 
            color: '#999999', 
            fontSize: '12px'
          }}>
            Safari iOS detectado - Otimizando experiência
          </p>
        </div>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Wrapper com estilos específicos para Safari mobile
  if (isSafariMobile) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          width: '100%',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          position: 'relative'
        }}
        className="safari-mobile-wrapper"
      >
        {children}
        <style>{`
          .safari-mobile-wrapper * {
            -webkit-transform: translateZ(0);
            -webkit-backface-visibility: hidden;
          }
          
          body {
            -webkit-overflow-scrolling: touch;
            overflow-scrolling: touch;
          }
          
          html, body {
            height: 100%;
          }
        `}</style>
      </div>
    );
  }

  // Renderização normal para outros navegadores
  return <>{children}</>;
};

export default SafariMobileFix;

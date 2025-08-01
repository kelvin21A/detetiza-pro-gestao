// Script para gerar ícones PWA para o DetetizaPro
// Este script cria ícones SVG simples nas dimensões necessárias

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');

// Criar diretório se não existir
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Template SVG para o ícone do DetetizaPro
const createIconSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Fundo branco -->
  <rect width="${size}" height="${size}" fill="#FFFFFF" rx="${size * 0.1}"/>
  
  <!-- Borda vermelha -->
  <rect x="${size * 0.05}" y="${size * 0.05}" width="${size * 0.9}" height="${size * 0.9}" 
        fill="none" stroke="#FF0000" stroke-width="${size * 0.02}" rx="${size * 0.08}"/>
  
  <!-- Ícone de spray/dedetização -->
  <g transform="translate(${size * 0.25}, ${size * 0.2})">
    <!-- Corpo do spray -->
    <rect x="0" y="${size * 0.15}" width="${size * 0.15}" height="${size * 0.4}" fill="#FF0000" rx="${size * 0.02}"/>
    
    <!-- Bico do spray -->
    <rect x="${size * 0.15}" y="${size * 0.18}" width="${size * 0.08}" height="${size * 0.06}" fill="#FF0000"/>
    
    <!-- Partículas do spray -->
    <circle cx="${size * 0.28}" cy="${size * 0.18}" r="${size * 0.01}" fill="#FF0000"/>
    <circle cx="${size * 0.32}" cy="${size * 0.15}" r="${size * 0.008}" fill="#FF0000"/>
    <circle cx="${size * 0.35}" cy="${size * 0.22}" r="${size * 0.006}" fill="#FF0000"/>
    <circle cx="${size * 0.38}" cy="${size * 0.18}" r="${size * 0.008}" fill="#FF0000"/>
    <circle cx="${size * 0.42}" cy="${size * 0.12}" r="${size * 0.006}" fill="#FF0000"/>
    
    <!-- Gatilho -->
    <path d="M ${size * 0.05} ${size * 0.25} Q ${size * 0.02} ${size * 0.28} ${size * 0.05} ${size * 0.32} 
             L ${size * 0.12} ${size * 0.32} Q ${size * 0.15} ${size * 0.28} ${size * 0.12} ${size * 0.25} Z" 
          fill="#FF0000"/>
  </g>
  
  <!-- Texto "DP" (DetetizaPro) -->
  <text x="${size * 0.5}" y="${size * 0.8}" text-anchor="middle" 
        font-family="Arial, sans-serif" font-weight="bold" 
        font-size="${size * 0.12}" fill="#FF0000">DP</text>
</svg>`;

// Tamanhos de ícones necessários para PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Gerar ícones SVG
iconSizes.forEach(size => {
  const svgContent = createIconSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✓ Gerado: ${filename}`);
});

// Criar ícones PNG simples (fallback)
iconSizes.forEach(size => {
  const svgContent = createIconSVG(size);
  // Para simplificar, vamos criar arquivos SVG com extensão PNG
  // Em produção, seria ideal usar uma biblioteca como sharp para gerar PNGs reais
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✓ Gerado: ${filename} (SVG como PNG)`);
});

// Criar ícones para shortcuts
const shortcutIcons = [
  { name: 'clients-shortcut.png', icon: 'clients' },
  { name: 'calls-shortcut.png', icon: 'calls' },
  { name: 'renewals-shortcut.png', icon: 'renewals' }
];

shortcutIcons.forEach(({ name, icon }) => {
  const svgContent = createIconSVG(96);
  const filepath = path.join(iconsDir, name);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✓ Gerado: ${name}`);
});

console.log('\n🎉 Todos os ícones PWA foram gerados com sucesso!');
console.log(`📁 Localização: ${iconsDir}`);
console.log('\n📝 Próximos passos:');
console.log('1. Execute o script: node scripts/generate-pwa-icons.js');
console.log('2. Os ícones SVG serão criados automaticamente');
console.log('3. Para produção, considere converter SVGs para PNGs reais');

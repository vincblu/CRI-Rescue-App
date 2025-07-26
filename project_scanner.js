const fs = require('fs');
const path = require('path');

// Script per documentare automaticamente il progetto RescueApp
console.log('🔍 RESCUE APP - SCANSIONE AUTOMATICA PROGETTO');
console.log('='.repeat(60));

const projectRoot = './';
const reportFile = 'RESCUE_APP_REPORT.md';

let report = `# 📊 RESCUE APP - REPORT AUTOMATICO
**Data:** ${new Date().toLocaleString('it-IT')}
**Directory:** ${path.resolve(projectRoot)}

## 📁 STRUTTURA FILE
\`\`\`
`;

function scanDirectory(dir, prefix = '', maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return;
  
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.startsWith('.') && !file.includes('expo')) return;
      if (file === 'node_modules') return;
      
      const fullPath = path.join(dir, file);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        report += `${prefix}📁 ${file}/\n`;
        scanDirectory(fullPath, prefix + '  ', maxDepth, currentDepth + 1);
      } else {
        const ext = path.extname(file);
        let icon = '📄';
        if (['.tsx', '.ts', '.js', '.jsx'].includes(ext)) icon = '⚛️';
        if (['.json'].includes(ext)) icon = '⚙️';
        if (['.md'].includes(ext)) icon = '📝';
        
        report += `${prefix}${icon} ${file}\n`;
      }
    });
  } catch (error) {
    report += `${prefix}❌ Errore lettura: ${error.message}\n`;
  }
}

// Scansiona struttura
scanDirectory(projectRoot);
report += '```\n\n';

// Analizza package.json
report += '## ⚙️ CONFIGURAZIONE PROGETTO\n';
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  report += `**Nome:** ${packageJson.name || 'N/A'}\n`;
  report += `**Versione:** ${packageJson.version || 'N/A'}\n`;
  report += `**Expo SDK:** ${packageJson.dependencies?.expo || 'N/A'}\n\n`;
  
  report += '### 📦 Dipendenze Principali:\n';
  Object.entries(packageJson.dependencies || {}).forEach(([name, version]) => {
    if (['expo', 'react', 'firebase', 'react-native'].some(key => name.includes(key))) {
      report += `- **${name}:** ${version}\n`;
    }
  });
  report += '\n';
} catch (error) {
  report += `❌ package.json non trovato: ${error.message}\n\n`;
}

// Analizza file principali
const keyFiles = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/maps.tsx', 
  'app/(tabs)/_layout.tsx',
  'app/_layout.tsx',
  'firebase_config.js',
  'app.json'
];

report += '## 📋 FILE PRINCIPALI\n';
keyFiles.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      
      report += `### ✅ ${filePath}\n`;
      report += `- **Dimensione:** ${Math.round(stats.size / 1024)}KB\n`;
      report += `- **Righe:** ${lines}\n`;
      report += `- **Modificato:** ${stats.mtime.toLocaleString('it-IT')}\n`;
      
      // Estrai informazioni chiave
      if (filePath.includes('index.tsx')) {
        const hasFirebase = content.includes('firebase');
        const hasStates = content.includes('useState');
        const hasButtons = content.includes('PressHoldButton');
        report += `- **Firebase:** ${hasFirebase ? '✅' : '❌'}\n`;
        report += `- **Stati React:** ${hasStates ? '✅' : '❌'}\n`;
        report += `- **Pressione Prolungata:** ${hasButtons ? '✅' : '❌'}\n`;
      }
      
      if (filePath.includes('maps.tsx')) {
        const hasMaps = content.includes('MapView');
        const hasLocation = content.includes('Location');
        report += `- **React Native Maps:** ${hasMaps ? '✅' : '❌'}\n`;
        report += `- **Geolocalizzazione:** ${hasLocation ? '✅' : '❌'}\n`;
      }
      
      report += '\n';
    } else {
      report += `### ❌ ${filePath} - NON TROVATO\n\n`;
    }
  } catch (error) {
    report += `### ⚠️ ${filePath} - ERRORE: ${error.message}\n\n`;
  }
});

// Funzionalità implementate
report += '## ✅ FUNZIONALITÀ RILEVATE\n';
try {
  const indexContent = fs.readFileSync('app/(tabs)/index.tsx', 'utf8');
  
  const features = [
    { name: 'Sistema Stati Squadre', check: 'LIBERA|IN_INTERVENTO|IN_TRASPORTO' },
    { name: 'Pressione Prolungata', check: 'PressHoldButton|holdDuration' },
    { name: 'Cronologia Interventi', check: 'cronologia|timeline' },
    { name: 'Firebase Firestore', check: 'firestore|collection' },
    { name: 'Notifiche Real-time', check: 'onSnapshot|notifiche' },
    { name: 'Design CRI', check: '#e53e3e|Croce Rossa' }
  ];
  
  features.forEach(feature => {
    const implemented = new RegExp(feature.check, 'i').test(indexContent);
    report += `- **${feature.name}:** ${implemented ? '✅ Implementato' : '❌ Mancante'}\n`;
  });
  
} catch (error) {
  report += `❌ Impossibile analizzare funzionalità: ${error.message}\n`;
}

report += '\n## 🚀 PROSSIMI STEP\n';
report += '1. Backup progetto corrente\n';
report += '2. Test funzionalità esistenti\n'; 
report += '3. Documentare problemi specifici\n';
report += '4. Implementare autenticazione\n\n';

report += '---\n*Report generato automaticamente*';

// Salva report
fs.writeFileSync(reportFile, report);

console.log(`✅ Report salvato in: ${reportFile}`);
console.log('📋 Contenuto:');
console.log(report);

// Mostra comandi utili
console.log('\n🔧 COMANDI UTILI:');
console.log('npm start          # Avvia progetto');
console.log('ls -la app/        # Mostra file app');
console.log('cat package.json   # Mostra configurazione');
console.log(`cat ${reportFile}        # Mostra questo report`);
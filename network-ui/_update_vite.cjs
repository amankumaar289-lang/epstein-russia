const fs = require('fs');
let config = fs.readFileSync('vite.config.ts', 'utf8');
config = config.replace(/return \d+; \/\/ fallback/, 'return 3010; // fallback');
config = config.replace(/target: `http:\/\/localhost:\d+`/, 'target: `http://localhost:3010`');
fs.writeFileSync('vite.config.ts', config);
console.log('Vite config updated to proxy port 3010');

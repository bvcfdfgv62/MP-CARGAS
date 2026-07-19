const https = require('https');

// Altere para a URL real da sua API ou projeto Supabase
const url = "https://ptzzeoxaivsdmpxptnnu.supabase.co/rest/v1/";

console.log("Iniciando script Keep-Alive do Supabase...");
console.log("Isso impedirá que o projeto gratuito seja pausado por inatividade.");

// Ping a cada 5 minutos
setInterval(() => {
  https.get(url, (res) => {
    console.log(`Ping executado: ${new Date().toLocaleString()} - Status: ${res.statusCode}`);
  }).on('error', (e) => {
    console.error(`Erro no ping: ${e.message}`);
  });
}, 300000); // 300000ms = 5 minutos

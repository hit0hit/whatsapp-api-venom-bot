const venom = require('venom-bot');

// Função para iniciar o Venom-Bot
async function startVenomBot() {
  try {
    const client = await venom.create(
      'HIT9423hfsd8234HJA324dbaasdC324H657HADA',
      (base64Qr, asciiQR, attempts, urlCode) => {
        console.log(asciiQR);

        // Salvar o QR Code em um arquivo
        const matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches.length !== 3) {
          throw new Error('String de entrada inválida');
        }
        
        const response = {
          type: matches[1],
          data: Buffer.from(matches[2], 'base64')
        };

        const imageBuffer = response;
        fs.writeFile(qrCodeFilePath, imageBuffer['data'], 'binary', (err) => {
          if (err) {
            console.error('Erro ao salvar o QR Code:', err);
          } else {
            console.log('QR Code salvo em:', qrCodeFilePath);
            app.qrCodeGenerated = true;
          }
        });
      },
      undefined,
      { logQR: false }
    );

    console.log('Venom-Bot inicializado com sucesso.');
    start(client); // Iniciar o servidor Express após inicializar o Venom-Bot
  } catch (error) {
    console.error('Erro ao iniciar o Venom-Bot:', error);
  }
}

// Função para manipular envio de mensagens
function start(client) {
  app.qrCodeGenerated = false;

  app.post("/send-message", async (req, res) => {
    const { to, message } = req.body;
    await client.sendText(to + '@c.us', message);
    res.json("Mensagem enviada com sucesso");
  });
}

// Iniciar o Venom-Bot após o servidor Express estar rodando
server.on('listening', () => {
  startVenomBot();
});

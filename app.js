// // ///////////// V4
const express = require('express');
const fs = require('fs');
const path = require('path');
const venom = require('venom-bot');
const pm2 = require('pm2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

let qrCodeGenerated = false;
let qrCodeFilePath = path.join(__dirname, 'qrCode.png');
const messages = [];


const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Servidor está rodando na porta ${PORT}`);
});


async function startVenomBot() {
  try {
    const client = await venom.create(
      'HIT9423hfsd8234HJA324dbaasdC324H657HADA',
      (base64Qr, asciiQR, attempts, urlCode) => {
        console.log(asciiQR);

        const matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches.length !== 3) {
          throw new Error('String de entrada inválida');
        }
        
        const response = {
          type: matches[1],
          data: Buffer.from(matches[2], 'base64')
        };

        const imageBuffer = response;
        fs.writeFile(qrCodeFilePath, imageBuffer['data'], 'base64', (err) => {
          if (err) {
            console.error('Erro ao salvar o QR Code:', err);
          } else {
            console.log('QR Code salvo em:', qrCodeFilePath);
            qrCodeGenerated = true;
          }
        });
      },
      undefined,
      { logQR: false }
    );

    console.log('Venom-Bot inicializado com sucesso.');
    qrCodeGenerated = false;
    start(client);
  } catch (error) {
    console.error('Erro ao iniciar o Venom-Bot:', error);
  }
}

function removeMessage(remetente, corpo) {
  messages = messages.filter(
    message => !(message.remetente === remetente && message.corpo === corpo)
  );
}

function formatDate(date) {
  let dates = new Date(date * 1000); 
  const mm = String(dates.getMonth() + 1).padStart(2, '0');
  const dd = String(dates.getDate()).padStart(2, '0');
  const yyyy = dates.getFullYear();
  const HH = String(dates.getHours()).padStart(2, '0');
  const MI = String(dates.getMinutes()).padStart(2, '0');
  const SS = String(dates.getSeconds()).padStart(2, '0');

  return `${mm}/${dd}/${yyyy} ${HH}:${MI}:${SS}`;
}

function messageId(id) {
  let messageId = null;
  if(id){
    const idParts = id.split('_');
    messageId = idParts.length >= 3 ? idParts[2] : null;
  }

  return messageId;
}


const { exec } = require('child_process');

app.post('/reiniciar', (req, res) => {
  const { reiniciar } = req.body;

  if (reiniciar === 1) {
    pm2.connect((err) => {
      if (err) {
        console.error('Erro ao conectar ao PM2:', err);
        return res.status(500).json({ error: 'Erro ao conectar ao PM2' });
      }

      pm2.flush((err, result) => {
        if (err) {
          console.error('Erro ao limpar os logs do PM2:', err);
          pm2.disconnect(); // Desconecta do PM2 em caso de erro
          return res.status(500).json({ error: 'Erro ao limpar os logs do PM2' });
        }

        console.log('Logs do PM2 foram limpos com sucesso:', result);

        pm2.restart('app.js', (err, apps) => {
          pm2.disconnect(); // Desconecta do PM2 após reiniciar o aplicativo

          if (err) {
            console.error('Erro ao reiniciar o servidor:', err);
            return res.status(500).json({ error: 'Erro ao reiniciar o servidor' });
          }

          console.log('Servidor reiniciado com sucesso:', apps);
          return res.json({ message: 'Servidor reiniciado com sucesso' });
        });
      });
    });
  } else {
    return res.status(400).json({ error: 'Valor inválido para reiniciar' });
  }
});

app.get('/', (req, res) => {
  if (qrCodeGenerated) {
    res.send(`
      <h1>Escaneie o QR Code do WhatsApp</h1>
      <img src="/qrCode.png" alt="QR Code">
    `);
  } else {
    res.send('<h1>QR Code não gerado ainda. Por favor, aguarde...</h1>');
  }
});

app.get('/qrCode.png', (req, res) => {
  if (fs.existsSync(qrCodeFilePath)) {
    res.sendFile(qrCodeFilePath);
  } else {
    res.status(404).send('QR Code não encontrado');
  }
});

function start(client) {
  qrCodeGenerated = false;

  app.post("/send-message", async (req, res) => {
    const { to, message } = req.body;
    await client.sendText(to + '@c.us', message);
    res.json("Mensagem enviada com sucesso");
  });
  
  client.onMessage(async (message) => {

    console.log(`Mensagem recebida: id: ${messageId(message.id)} \ data: ${formatDate(message.t)} \ tel: ${message.from} \ mensagem: ${message.body}`);
    const novaMensagem = {
      id: messageId(message.id),
      data: formatDate(message.t),
      remetente: message.from,
      corpo: message.body
    };
    console.log(novaMensagem);
    messages.push(novaMensagem);
    if (message.body === 'Oi') {
      await client.sendText(message.from, 'Olá! Como posso ajudar?');
    }
    if (message.body === '/dev') {
      await client.sendText(message.from, '> Desenvolvido por ~Dev-Hit~\n> `Nome: henrique Silva Cruz`\n> `Empresa: OK Cell`\n> ~GitHub: https://github.com/hit0hit~');
    }
  });

  app.post('/get-message', async (req, res) => {
    const { id } = req.body;
    const codigo = id;
    let mensagemEncontrada = [];

    for (const f of messages) {
      if (f.remetente === codigo) {
        mensagemEncontrada.push(f);
      }
    }
  
    if (mensagemEncontrada.length > 0) {
      res.json({ mensagem: mensagemEncontrada });
    } else {
      res.json({ mensagem: 'Nenhuma mensagem encontrada para este código.' });
    }
  });

  app.post('/envia-message', async (req, res) => {
    const { t, m } = req.body;
    if(t && m){
      await client.sendText(t, m);

      res.status(200).send("Mensagem enviada com sucesso");
    } else {
      res.status(400).send('Remetente e corpo da mensagem são necessários.');
    }
  });

  app.post('/delete-message', async (req, res) => {
    const { t , m } = req.body;
  
    if (t && m) {
      removeMessage(t, m);
      res.status(200).send('Mensagem removida com sucesso.');
    } else {
      res.status(400).send('Remetente e corpo da mensagem são necessários.');
    }
  });

}

server.on('listening', () => {
  console.log('Servidor está ouvindo na porta ', server.address().port);
  startVenomBot();
});





// // ///////////// V3

// const venom = require('venom-bot');
// const express = require('express');
// const fs = require('fs');
// const path = require('path');
// const pm2 = require('pm2');

// const app = express();
// app.use(express.json());

// let qrCodeGenerated = false;
// let qrCodeFilePath = path.join(__dirname, 'qrCode.png');

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Servidor está rodando na porta ${PORT}`);
// });


// app.post('/reiniciar', (req, res) => {
//   const { reiniciar } = req.body;
  
//   if (reiniciar === 1) {
//     // Conecta ao PM2
//     pm2.connect((err) => {
//       if (err) {
//         console.error('Erro ao conectar ao PM2:', err);
//         return res.status(500).json({ error: 'Erro ao conectar ao PM2' });
//       }
      
//       // Reinicia o aplicativo com PM2
//       pm2.restart('app.js', (err, apps) => {
//         pm2.disconnect(); // Desconecta do PM2 após reiniciar o aplicativo
        
//         if (err) {
//           console.error('Erro ao reiniciar o servidor:', err);
//           return res.status(500).json({ error: 'Erro ao reiniciar o servidor' });
//         }
        
//         console.log('Servidor reiniciado com sucesso:', apps);
//         return res.json({ message: 'Servidor reiniciado com sucesso' });
//       });
//     });
//   } else {
//     return res.status(400).json({ error: 'Valor inválido para reiniciar' });
//   }
// });

// venom.create(
//   'HIT9423hfsd8234HJA324dbaasdC324H657HADA',
//   (base64Qr, asciiQR, attempts, urlCode) => {
//     console.log(asciiQR);

//     var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
//       response = {};

//     if (matches.length !== 3) {
//       return new Error('Invalid input string');
//     }
//     response.type = matches[1];
//     response.data = new Buffer.from(matches[2], 'base64');

//     var imageBuffer = response;
//     fs.writeFile(
//       qrCodeFilePath,
//       imageBuffer['data'],
//       'binary',
//       function (err) {
//         if (err) {
//           console.log(err);
//         } else {
//           console.log('QR Code salvo em:', qrCodeFilePath);
//           qrCodeGenerated = true;
//         }
//       }
//     );
//   },
//   undefined,
//   { logQR: false }
// )
// .then((client) => {
//   console.log('Venom-Bot inicializado com sucesso.');
//   start(client); 
// })
// .catch((erro) => {
//   console.log('Erro ao iniciar o Venom-Bot:', erro);
// });

// function start(client) {
//   qrCodeGenerated = false;

//   app.post("/send-message", async (req, res) => {
//     const { to, message } = req.body;
//     await client.sendText(to + '@c.us', message);
//     res.json("Mensagem enviada com sucesso");
//   });

//   app.get('/', (req, res) => {
//     if (qrCodeGenerated) {
//       res.send(`
//         <h1>Escaneie o QR Code do WhatsApp</h1>
//         <img src="/qrCode.png" alt="QR Code">
//       `);
//     } else {
//       res.send('<h1>QR Code não gerado ainda. Por favor, aguarde...</h1>');
//     }
//   });

//   app.get('/qrCode.png', (req, res) => {
//     if (fs.existsSync(qrCodeFilePath)) {
//       res.sendFile(qrCodeFilePath);
//     } else {
//       res.status(404).send('QR Code não encontrado');
//     }
//   });
// }











// // ///////////// V2
// const venom = require('venom-bot');
// const pm2 = require('pm2');
// const express = require('express');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// app.use(express.json());
// let qrCodeGenerated = false;
// let qrCodeFilePath = path.join(__dirname, 'qrCode.png');


// venom
//   .create(
//     'HIT9423hfsd8234HJA324dbaasdC324H657HADA',
//     (base64Qr, asciiQR, attempts, urlCode) => {
//       console.log(asciiQR);
//       var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
//         response = {};

//       if (matches.length !== 3) {
//         return new Error('Invalid input string');
//       }
//       response.type = matches[1];
//       response.data = new Buffer.from(matches[2], 'base64');

//       var imageBuffer = response;
//       fs.writeFile(
//         qrCodeFilePath,
//         imageBuffer['data'],
//         'binary',
//         function (err) {
//           if (err != null) {
//             console.log(err);
//           } else {
//             console.log('QR Code salvo em:', qrCodeFilePath);
//             qrCodeGenerated = true;
//           }
//         }
//       );
//     },
//     undefined,
//     { logQR: false }
//   )
//   .then((client) => start(client))
//   .catch((erro) => {
//     console.log(erro);
//   });

// const { exec } = require('child_process');

// app.post('/reiniciar', (req, res) => {
//     const { reiniciar } = req.body;
//     if (reiniciar === 1) {
//       pm2.connect((err) => {
//         if (err) {
//           console.error('Erro ao conectar ao PM2:', err);
//           return res.status(500).json({ error: 'Erro ao conectar ao PM2' });
//         }
      
//         pm2.restart('app.js', (err, apps) => {
//           pm2.disconnect(); // Desconecta do PM2 após reiniciar o aplicativo
      
//           if (err) {
//             console.error('Erro ao reiniciar o servidor:', err);
//             return res.status(500).json({ error: 'Erro ao reiniciar o servidor' });
//           }
      
//           console.log('Servidor reiniciado com sucesso:', apps);
//           return res.json({ message: 'Servidor reiniciado com sucesso' });
//         });
//       });
//     } else {
//       return res.status(400).json({ error: 'Valor inválido para reiniciar' });
//     }
//   });
  
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
// });


// app.get('/', (req, res) => {
//   if (qrCodeGenerated) {
//     res.send(`
//       <h1>Escaneie o QR Code do WhatsApp</h1>
//       <img src="/qrCode.png" alt="QR Code">
//     `);
//   } else {
//     res.send('<h1>QR Code não gerado ainda. Por favor, aguarde...</h1>');
//   }
// });


// app.get('/qrCode.png', (req, res) => {
//   if (fs.existsSync(qrCodeFilePath)) {
//     res.sendFile(qrCodeFilePath);
//   } else {
//     res.status(404).send('QR Code não encontrado');
//   }
// });


// function start(client) {
//     qrCodeGenerated = false;
//     app.post("/send-message", async (req, res) => {
//         const {to, message} = req.body;
//         await client.sendText(to + '@c.us', message);
//         res.json("mensagem enviada");
//     });
// };





///////////// V1


// const express = require('express');
// const { error } = require('qrcode-terminal');
// const venom = require('venom-bot');

// const app = express();
// app.use(express.json());
// const port = process.env.PORT || 3000;

// venom
//     .create({
//         session: 'apizap',
//         multidevice: true
//     })
//     .then((client) => start(client))
//     .catch((erro) => {
//         console.log(erro);
//     });

// function start(client) {
//     app.post("/send-message", async (req, res) => {
//         const {to, message} = req.body;
//         await client.sendText(to + '@c.us', message);
//         res.json("mensagem enviada");
//     });
// };

// app.listen(port,() => {
//     console.log(`API rodando na porta ${port}`);
// });








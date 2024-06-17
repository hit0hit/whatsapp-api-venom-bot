// javascript: 
apex.server.process("ENVIAR_WATS", {
    x01: "&ID.",
    dataType: "json"
}, {
    dataType: "text"
}).then((response => {
    let lista = [];
    try {
        lista = JSON.parse(response).v_json_array;


        var xhr = new XMLHttpRequest();
        var url = "http://localhost:3000/send-message";
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");

        var data = JSON.stringify({
            "to": "5562993332503",
            "message": "Que horas vai ser a reunião?"
        });

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log("Resposta do servidor: ", xhr.responseText);
                } else {
                    console.error("Erro ao enviar a mensagem: ", xhr.statusText);
                }
            }
        };

        xhr.send(data);



    } catch (error) {}
    return lista;
})).catch((error => []));
















// javascript: apex.server.process("ENVIAR_NFE", {
//     x01: "&ID.",
//     dataType: "json"
// }, {
//     dataType: "text"
// }).then((response => {
//     let lista = [];
//     try {
//         lista = JSON.parse(response).v_json_array;
//         var xhr = new XMLHttpRequest();
//         var url = "https://javascript-master-production.up.railway.app/";
//         xhr.open("POST", url, true);
//         xhr.setRequestHeader("Content-Type", "application/json");
//         xhr.onreadystatechange = function() {
//             if (xhr.readyState === 4 && xhr.status === 200) {
//                 localStorage.setItem('respostaPOST', xhr.responseText);
//                 var respostaArmazenada = localStorage.getItem('respostaPOST');
//                 if (respostaArmazenada) {
//                     var respostaObjeto = JSON.parse(respostaArmazenada);
//                     if (respostaObjeto.data.erros && respostaObjeto.data.erros.length > 0) {
//                         var urlDanfse2 = respostaObjeto.data.erros[0].mensagem;
//                     };
//                     var urlDanfse = respostaObjeto.data.mensagem;
//                     var urlDanfse3 = respostaObjeto.data.status;
//                     apex.message.clearErrors();
//                     if (urlDanfse) {
//                         if ("Line 89, Col 0: 89:0: ERROR: Element '{http://www.portalfiscal.inf.br/nfe}vBC': This element is not expected. Expected is ( {http://www.portalfiscal.inf.br/nfe}modBC )." == urlDanfse) {
//                             urlDanfse = "Essa Nota não está sujeita à tributação pelo regime simplificado, defina outro Código ICSM.";
//                         };
//                         if ("Line 89, Col 0: 89:0: ERROR: Element '{http://www.portalfiscal.inf.br/nfe}pRedBC': This element is not expected. Expected is ( {http://www.portalfiscal.inf.br/nfe}modBC )." == urlDanfse) {
//                             urlDanfse = "Essa Nota não está sujeita à tributação pelo regime simplificado, defina outro Código ICSM.";
//                         };
//                         if ("Line 89, Col 0: 89:0: ERROR: Element '{http://www.portalfiscal.inf.br/nfe}vBCST': This element is not expected. Expected is ( {http://www.portalfiscal.inf.br/nfe}modBCST )." == urlDanfse) {
//                             urlDanfse = "Essa Nota não está sujeita à tributação pelo regime simplificado, defina outro Código ICSM.";
//                         };
//                         apex.message.showErrors([{
//                             type: apex.message.TYPE.ERROR,
//                             location: ['page'],
//                             message: urlDanfse
//                         }]);
//                     };
//                     if (urlDanfse3) {
//                         apex.message.showErrors([{
//                             type: apex.message.TYPE.ERROR,
//                             location: ['page'],
//                             message: "Processando Autorização"
//                         }]);
//                     };
//                     if (urlDanfse2) {
//                         apex.message.showErrors([{
//                             type: apex.message.TYPE.ERROR,
//                             location: ['page'],
//                             message: urlDanfse2
//                         }]);
//                     }
//                 } else {
//                     console.log('Nenhuma resposta armazenada no localStorage.');
//                 };
//             }
//         };
//         var dadosRecebidos = {
//             lista
//         };
//         xhr.send(JSON.stringify(dadosRecebidos));
//     } catch (error) {}
//     return lista;
// })).catch((error => []));
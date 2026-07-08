const API_URL = "https://script.google.com/macros/s/AKfycbykNrT7BkY_JRHqMD_yNKRFWnXgYWZjzTOiE8rB3CbneXwa7ljfTENWbQlhOWHzP8PB/exec";

const parametros = new URLSearchParams(window.location.search);
const codigoRecebido = parametros.get("codigo");

validarConvite();

async function validarConvite() {

    if (!codigoRecebido) {
        mostrarInvalido("Código não informado.");
        return;
    }

    try {

        const resposta = await fetch(
            API_URL + "?acao=validar&codigo=" + encodeURIComponent(codigoRecebido)
        );

        const dados = await resposta.json();

        if (!dados.sucesso) {
            mostrarInvalido(dados.mensagem);
            return;
        }

        if (dados.utilizado) {

            document.getElementById("status").innerHTML = "⚠️";

            document.getElementById("titulo").innerHTML =
                "QR já utilizado";

            document.getElementById("nome").innerHTML =
                dados.nome;

            document.getElementById("dados").innerHTML =
                "Entrada já registrada.";

            document.getElementById("codigo").innerHTML =
                "🎟️ " + dados.codigo;

            return;
        }

        document.getElementById("status").innerHTML = "✅";

        document.getElementById("titulo").innerHTML =
            "Entrada liberada";

        document.getElementById("nome").innerHTML =
            dados.nome;

        document.getElementById("dados").innerHTML =
            "👨 Adultos: " + dados.adultos + "<br>" +
            "🧒 Crianças: " + dados.criancas;

        document.getElementById("codigo").innerHTML =
            "🎟️ " + dados.codigo;

    } catch (erro) {

        document.getElementById("status").innerHTML = "❌";

        document.getElementById("titulo").innerHTML =
            "Erro";

        document.getElementById("nome").innerHTML = "";

        document.getElementById("dados").innerHTML =
            "Falha ao consultar a planilha.";

        document.getElementById("codigo").innerHTML = "";
    }
}

function mostrarInvalido(mensagem) {

    document.getElementById("status").innerHTML = "❌";

    document.getElementById("titulo").innerHTML =
        "Convite inválido";

    document.getElementById("nome").innerHTML = "";

    document.getElementById("dados").innerHTML =
        mensagem;

    document.getElementById("codigo").innerHTML = "";
}
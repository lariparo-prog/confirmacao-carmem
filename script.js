const API_URL = "https://script.google.com/macros/s/AKfycbz9nQMH2SCjyatiJEz33UtnYgkRdMrcJVlwZmb-qYyTBQ1ZV46sCe8eTK6ZCO5VkhQntQ/exec";

const URL_PUBLICA = "https://lariparo-prog.github.io/confirmacao-carmem/";

let nomeConvidado = "";
let quantidadeAdultos = 1;
let quantidadeCriancas = 0;
let codigoConvidado = "";
let convidadoEscolhido = null;

// Lista completa de convidados, carregada 1x quando a página abre.
// A busca depois é feita em cima dela, sem chamar o Google de novo.
let todosOsConvidados = [];
let listaCarregada = false;

window.onload = function () {
    const busca = document.getElementById("buscaNome");

    if (busca) {
        // Carrega a lista inteira assim que a tela abre
        carregarTodosConvidados();

        busca.addEventListener("input", function () {
            filtrarConvidados();
        });
    }
};

function mostrarTela(idTela) {
    document.getElementById("tela1").classList.add("escondido");
    document.getElementById("tela2").classList.add("escondido");
    document.getElementById("loading").classList.add("escondido");
    document.getElementById("tela3").classList.add("escondido");
    document.getElementById("tela4").classList.add("escondido");

    document.getElementById(idTela).classList.remove("escondido");
}

async function carregarTodosConvidados() {
    const area = document.getElementById("listaConvidados");

    try {
        const resposta = await fetch(API_URL + "?acao=buscarConvidados&nome=");
        const dados = await resposta.json();

        if (dados.sucesso && dados.convidados) {
            todosOsConvidados = dados.convidados;
        }

        listaCarregada = true;
    } catch (erro) {
        listaCarregada = false;

        if (area) {
            area.innerHTML = "<p class='subtitulo'>Não foi possível carregar a lista. Verifique sua internet e recarregue a página.</p>";
        }
    }
}

function filtrarConvidados() {
    const texto = document.getElementById("buscaNome").value.trim().toLowerCase();
    const area = document.getElementById("listaConvidados");

    area.innerHTML = "";
    convidadoEscolhido = null;

    document.getElementById("convidadoSelecionado").classList.add("escondido");
    document.getElementById("convidadoSelecionado").innerHTML = "";

    if (!listaCarregada) {
        area.innerHTML = "<p class='subtitulo'>Carregando lista de convidados...</p>";
        return;
    }

    if (texto.length < 2) {
        return;
    }

    const resultado = todosOsConvidados.filter(function (item) {
        return String(item.nome || "").toLowerCase().includes(texto);
    });

    if (resultado.length === 0) {
        area.innerHTML = "<p class='subtitulo'>Nenhum convidado encontrado.</p>";
        return;
    }

    const chaves = new Set();

    resultado.forEach(function (item) {
        const chave = String(item.codigo || "").trim();

        if (chaves.has(chave)) {
            return;
        }

        chaves.add(chave);

        const botao = document.createElement("button");
        botao.type = "button";
        botao.innerHTML = item.nome;

        botao.onclick = function () {
            escolherConvidado(item);
        };

        area.appendChild(botao);
    });
}

function escolherConvidado(item) {
    convidadoEscolhido = item;

    codigoConvidado = item.codigo;
    nomeConvidado = item.nome;
    quantidadeAdultos = Number(item.adultos) || 0;
    quantidadeCriancas = Number(item.criancas) || 0;

    document.getElementById("buscaNome").value = item.nome;
    document.getElementById("listaConvidados").innerHTML = "";

    const area = document.getElementById("convidadoSelecionado");

    let resumo = `Adultos: ${quantidadeAdultos}`;

    if (quantidadeCriancas > 0) {
        resumo += `<br>Crianças: ${quantidadeCriancas}`;
    }

    area.classList.remove("escondido");
    area.innerHTML = `
        <div class="contador">
            <span>Convidado selecionado</span>
            <strong>${item.nome}</strong>
            <p class="subtitulo">${resumo}</p>
        </div>
    `;
}

function conferirConvidadoSelecionado() {
    if (!convidadoEscolhido) {
        alert("Digite seu nome e selecione um convidado da lista.");
        return false;
    }

    return true;
}

function processarConfirmacao() {
    if (!conferirConvidadoSelecionado()) {
        return;
    }

    mostrarTela("loading");

    setTimeout(function () {
        finalizarConfirmacao();
    }, 1200);
}

function processarNaoComparecimento() {
    if (!conferirConvidadoSelecionado()) {
        return;
    }

    mostrarTela("loading");

    setTimeout(function () {
        finalizarNaoComparecimento();
    }, 1200);
}

function gerarLinkValidacao() {
    return URL_PUBLICA + "validar.html?codigo=" + encodeURIComponent(codigoConvidado);
}

function gerarQRCode() {
    let linkValidacao = gerarLinkValidacao();
    let areaQR = document.getElementById("qrImagem");

    areaQR.innerHTML = "";

    new QRCode(areaQR, {
        text: linkValidacao,
        width: 220,
        height: 220,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

async function salvarConfirmacao(statusResposta) {
    let confirmacao = {
        acao: "salvar",
        nome: nomeConvidado,
        adultos: quantidadeAdultos,
        criancas: quantidadeCriancas,
        codigo: codigoConvidado,
        data: new Date().toLocaleString("pt-BR"),
        status: statusResposta
    };

    await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(confirmacao)
    });
}

async function finalizarConfirmacao() {
    await salvarConfirmacao("confirmado");

    mostrarTela("tela3");

    document.getElementById("nomeConfirmado").innerHTML = nomeConvidado;

    let totalParticipantes = quantidadeAdultos + quantidadeCriancas;

    let resumo = totalParticipantes + " participante";

    if (totalParticipantes > 1) {
        resumo += "s";
    }

    document.getElementById("resumoFinal").innerHTML = resumo;

    if (document.querySelector(".codigo")) {
        document.querySelector(".codigo").innerHTML = codigoConvidado;
    }

    gerarQRCode();
}

async function finalizarNaoComparecimento() {
    await salvarConfirmacao("não comparecerá");

    mostrarTela("tela4");

    document.getElementById("nomeNaoVai").innerHTML =
        nomeConvidado + "<br>Resposta: não comparecerá.";
}

function salvarComprovante() {
    let comprovante = document.getElementById("tela3");
    let botaoSalvar = document.querySelector(".botao-salvar");
    let botaoVoltar = document.querySelector(".ticket-botao:not(.botao-salvar)");

    if (botaoSalvar) {
        botaoSalvar.style.display = "none";
    }

    if (botaoVoltar) {
        botaoVoltar.style.display = "none";
    }

    comprovante.classList.remove("animado");

    let areaExportacao = document.createElement("div");

    areaExportacao.style.width = "420px";
    areaExportacao.style.minHeight = "760px";
    areaExportacao.style.padding = "36px 26px";
    areaExportacao.style.background = "#f9f6ef";
    areaExportacao.style.display = "flex";
    areaExportacao.style.justifyContent = "center";
    areaExportacao.style.alignItems = "flex-start";

    let marcador = document.createElement("div");

    comprovante.parentNode.insertBefore(marcador, comprovante);
    document.body.appendChild(areaExportacao);
    areaExportacao.appendChild(comprovante);

    setTimeout(function () {
        html2canvas(areaExportacao, {
            scale: 3,
            useCORS: true,
            backgroundColor: null
        }).then(function (canvas) {
            let link = document.createElement("a");

            link.download = "comprovante-" + codigoConvidado + ".png";
            link.href = canvas.toDataURL("image/png");

            link.click();

            marcador.parentNode.insertBefore(comprovante, marcador);
            marcador.remove();
            areaExportacao.remove();

            if (botaoSalvar) {
                botaoSalvar.style.display = "block";
            }

            if (botaoVoltar) {
                botaoVoltar.style.display = "block";
            }

            alert("Comprovante salvo com sucesso!");
        });
    }, 500);
}

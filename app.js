let tracos = JSON.parse(localStorage.getItem("tracos")) || [];

const tabelaBody = document.querySelector("#tabelaMateriais tbody");
const resultadoBody = document.getElementById("resultadoBody");

document.getElementById("data").value =
    new Date().toISOString().split("T")[0];

/* ==========================
INICIALIZAÇÃO
========================== */

window.onload = () => {
    carregarListaTracos();
    criarMateriaisPadrao();
    calcular();
};

/* ==========================
MATERIAIS PADRÃO
========================== */

function criarMateriaisPadrao() {

    if (tabelaBody.children.length > 0) return;

    const materiais = [
        ["Brita 1", 1190, 0.5, 0.5],
        ["Areia Natural", 924, 5.0, 0.8],
        ["Cimento", 205, 0, 0],
        ["Água", 176, 0, 0],
        ["Aditivo", 1.84, 0, 0]
    ];

    materiais.forEach(item => {
        adicionarLinha(item[0], item[1], item[2], item[3]);
    });
}

/* ==========================
ADICIONAR LINHA
========================== */

function adicionarLinha(material = "", massa = 0, umidade = 0, absorcao = 0) {

    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td><input type="text" class="material" value="${material}"></td>
        <td><input type="number" class="massa" value="${massa}"></td>
        <td><input type="number" class="umidade" value="${umidade}"></td>
        <td><input type="number" class="absorcao" value="${absorcao}"></td>
        <td class="corrigida">0.00</td>
        <td>
            <button class="btn btn-danger" onclick="removerLinha(this)">Excluir</button>
        </td>
    `;

    tabelaBody.appendChild(tr);
}

/* ==========================
REMOVER LINHA
========================== */

function removerLinha(botao) {

    if (!confirm("Deseja remover este material?")) return;

    botao.closest("tr").remove();
    calcular();
}

/* ==========================
CÁLCULO PRINCIPAL
========================== */

function calcular() {

    const volume = parseFloat(document.getElementById("volume").value) || 1;

    const linhas = document.querySelectorAll("#tabelaMateriais tbody tr");

    resultadoBody.innerHTML = "";

    let aguaProjeto = 0;
    let correcaoTotal = 0;
    let totalProduzido = 0;

    // 1ª PASSADA (calcular água)
    linhas.forEach(linha => {

        const material = linha.querySelector(".material").value;
        const massa = parseFloat(linha.querySelector(".massa").value) || 0;
        const umidade = parseFloat(linha.querySelector(".umidade").value) || 0;
        const absorcao = parseFloat(linha.querySelector(".absorcao").value) || 0;

        const nome = material.toLowerCase();

        if (nome.includes("água") || nome.includes("agua")) {
            aguaProjeto = massa;
        } else {
            correcaoTotal += ((umidade - absorcao) * massa) / 100;
        }
    });

    let aguaCorrigida = aguaProjeto - correcaoTotal;
    if (aguaCorrigida < 0) aguaCorrigida = 0;

    // 2ª PASSADA (atualizar tabela)
    linhas.forEach(linha => {

        const material = linha.querySelector(".material").value;
        const massa = parseFloat(linha.querySelector(".massa").value) || 0;
        const umidade = parseFloat(linha.querySelector(".umidade").value) || 0;
        const absorcao = parseFloat(linha.querySelector(".absorcao").value) || 0;

        const nome = material.toLowerCase();

        let massaCorrigida = massa;

        if (nome.includes("água") || nome.includes("agua")) {
            massaCorrigida = aguaCorrigida;
        } else {
            massaCorrigida = massa + (((umidade - absorcao) * massa) / 100);
        }

        if (nome.includes("aditivo")) {
            linha.querySelector(".corrigida").textContent = massaCorrigida.toFixed(2);
        } else {
            linha.querySelector(".corrigida").textContent = Math.round(massaCorrigida);
        }

        const totalMaterial = massaCorrigida * volume;

        totalProduzido += totalMaterial;

        resultadoBody.innerHTML += `
            <tr>
                <td>${material}</td>
                <td>${nome.includes("aditivo")
                ? totalMaterial.toFixed(2)
                : Math.round(totalMaterial)
            }  
                </td>
            </tr>
        `;
    });

    atualizarDashboard(linhas.length, volume, aguaCorrigida, totalProduzido);
}

/* ==========================
DASHBOARD
========================== */

function atualizarDashboard(materiais, volume, agua, total) {

    document.getElementById("totalMateriais").textContent = materiais;
    document.getElementById("dashboardVolume").textContent = volume.toFixed(2) + " m³";
    document.getElementById("dashboardAgua").textContent = agua.toFixed(2) + " kg";
    document.getElementById("dashboardTotal").textContent = Math.round(total) + " kg";
}

/* ==========================
SALVAR TRAÇO
========================== */

function salvarTraco() {

    const nome = document.getElementById("nomeTraco").value.trim();
    if (!nome) return alert("Informe o nome do traço.");

    const materiais = [];

    document.querySelectorAll("#tabelaMateriais tbody tr").forEach(linha => {

        materiais.push({
            material: linha.querySelector(".material").value,
            massa: parseFloat(linha.querySelector(".massa").value) || 0,
            umidade: parseFloat(linha.querySelector(".umidade").value) || 0,
            absorcao: parseFloat(linha.querySelector(".absorcao").value) || 0
        });

    });

    const traco = {
        nome,
        dosagem: document.getElementById("dosagem").value,
        resistencia: document.getElementById("resistencia").value,
        data: document.getElementById("data").value,
        volume: parseFloat(document.getElementById("volume").value) || 1,
        materiais
    };

    const nomeNormalizado = nome.trim().toLowerCase();

    const existe = tracos.some(
        t => t.nome.trim().toLowerCase() === nomeNormalizado
    );

    if (existe) {
        alert("Já existe um traço cadastrado com este nome.");
        return;
    }

    tracos.push(traco);

    localStorage.setItem("tracos", JSON.stringify(tracos));

    carregarListaTracos();

    alert("Traço salvo com sucesso.");
}

/* ==========================
CARREGAR TRAÇO
========================== */

function carregarTraco() {

    const index = document.getElementById("listaTracos").value;
    if (index === "") return;

    const traco = tracos[index];

    document.getElementById("nomeTraco").value = traco.nome;
    document.getElementById("dosagem").value = traco.dosagem || "";
    document.getElementById("resistencia").value = traco.resistencia || "";
    document.getElementById("data").value = traco.data || "";
    document.getElementById("volume").value = traco.volume || 1;

    tabelaBody.innerHTML = "";

    traco.materiais.forEach(item => {
        adicionarLinha(item.material, item.massa, item.umidade, item.absorcao);
    });

    calcular();
}

/* ==========================
LISTA TRAÇOS
========================== */

function carregarListaTracos() {

    const lista = document.getElementById("listaTracos");

    lista.innerHTML = '<option value="">Selecione um traço</option>';

    tracos.forEach((t, i) => {
        lista.innerHTML += `<option value="${i}">${t.nome}</option>`;
    });
}

/* ==========================
EXCLUIR
========================== */

function excluirTraco() {

    const nome = document.getElementById("nomeTraco").value;
    if (!nome) return;

    if (!confirm("Deseja excluir este traço?")) return;

    tracos = tracos.filter(t => t.nome !== nome);

    localStorage.setItem("tracos", JSON.stringify(tracos));

    carregarListaTracos();

    alert("Traço excluído.");
}

/* ==========================
DUPLICAR
========================== */

function duplicarTraco() {

    const index = document.getElementById("listaTracos").value;
    if (index === "") return alert("Selecione um traço.");

    const copia = JSON.parse(JSON.stringify(tracos[index]));
    copia.nome += " - Cópia";

    tracos.push(copia);

    localStorage.setItem("tracos", JSON.stringify(tracos));

    carregarListaTracos();

    alert("Traço duplicado.");
}

/* ==========================
PESQUISA
========================== */

document.getElementById("pesquisaTraco").addEventListener("input", function () {

    const termo = this.value.toLowerCase();

    const lista = document.getElementById("listaTracos");

    lista.innerHTML = '<option value="">Selecione um traço</option>';

    tracos.forEach((t, i) => {

        if (t.nome.toLowerCase().includes(termo)) {
            lista.innerHTML += `<option value="${i}">${t.nome}</option>`;
        }

    });

});

/* ==========================
BACKUP
========================== */

function fazerBackup() {

    const blob = new Blob(
        [JSON.stringify(tracos, null, 2)],
        { type: "application/json" }
    );

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "backup-tracos.json";
    a.click();
}

/* ==========================
EVENTOS AUTOMÁTICOS
========================== */

document.addEventListener("input", function (e) {

    if (
        e.target.classList.contains("massa") ||
        e.target.classList.contains("umidade") ||
        e.target.classList.contains("absorcao") ||
        e.target.classList.contains("material") ||
        e.target.id === "volume"
    ) {
        calcular();
    }

});

/* ==========================
EXPORTAÇÕES
========================== */

function exportarPDF() {
    window.print();
}

function exportarExcel() {
    alert("Função será implementada na próxima versão.");
}

/* ==========================
PWA
========================== */

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}
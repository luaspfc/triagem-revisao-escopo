# Triagem-piloto por pares — revisão de escopo

Página pública (GitHub Pages) para que duas revisoras façam, de forma independente, a triagem de título e resumo da mesma amostra de artigos do PubMed. As decisões ficam salvas numa planilha Google privada da responsável pelo estudo, através de um Google Apps Script.

- **Página:** https://luaspfc.github.io/triagem-revisao-escopo/
- **Ninguém precisa de login.** Cada revisora acessa por um link individual com chave (`?revisor=…&chave=…`).
- **Piloto atual:** 25 PMIDs, lote `07258cb162643f64`, semente `20261102`, sorteados de 3.481 PMIDs únicos.

## Como funciona

```
Navegador da revisora ──(link com chave)──▶ GitHub Pages (index.html + dados/*.json)
        │
        └──fetch POST──▶ Apps Script (backend/Code.gs) ──▶ Planilha Google privada
```

O repositório é público, mas não guarda nenhum dado das revisoras nem as chaves. As chaves ficam nas Propriedades do script, e as decisões ficam na planilha.

## Colocar no ar (uma vez)

1. Acesse https://script.google.com/home/projects/create e crie o projeto **Triagem PubMed — Luana e Beatriz**.
2. Apague o conteúdo de `Code.gs` no editor e cole o arquivo [`backend/Code.gs`](backend/Code.gs). Salve. **Não é preciso criar o arquivo Index.html no Apps Script**: a página fica no GitHub.
3. Selecione a função **setup** e clique em **Executar**. Aceite as permissões (planilha, Docs e Drive para o PDF).
4. Clique em **Implantar → Nova implantação → Aplicativo da Web**, com **Executar como: Eu** e **Quem tem acesso: Qualquer pessoa**. Copie a URL que termina em `/exec`.
5. No GitHub, edite [`config.js`](config.js) e cole a URL em `API_URL: '…/exec'`. Salve (commit).
6. No Apps Script, execute **mostrarLinks**. O registro de execução mostra o **LINK INDIVIDUAL LUANA** e o **LINK INDIVIDUAL BEATRIZ**.
7. Envie à Beatriz **apenas o link dela**. Guarde o seu.

> Se você alterar o Code.gs depois, use **Implantar → Gerenciar implantações → editar → Nova versão** para manter a mesma URL `/exec`.

## Estrutura (pensada para virar skill)

| Arquivo | O que é | Muda a cada nova triagem? |
|---|---|---|
| `dados/amostra.json` | Lote, semente, universo e os artigos sorteados (PMID, título, resumo, autores, DOI) | Sim |
| `dados/protocolo.json` | Título, revisoras, regra central, critérios PCC, motivos E01–E08, limiares | Sim |
| `config.js` | URL da API do Apps Script | Sim (uma vez por implantação) |
| `index.html` | Interface: triagem, lacre, relatório de concordância, Kappa, PDF | Não |
| `backend/Code.gs` | API, planilha (Decisoes, Historico, Finalizacao) e geração do PDF | Só o bloco de constantes do topo |

Uma futura skill pode gerar `dados/amostra.json` a partir de uma exportação do PubMed (sorteio com semente), preencher `dados/protocolo.json` com os critérios da revisão e atualizar as constantes do `Code.gs`. A interface continua a mesma.

**Limitação atual:** este piloto está fixo em 25 artigos e 2 revisoras (contagens, limiares 19/22 e textos). Generalizar para N artigos é o primeiro passo da skill.

## Registros

Na planilha criada pelo `setup` (o endereço aparece em `mostrarLinks`):

- **Decisoes:** estado atual de cada artigo e revisora.
- **Historico:** todas as gravações, com versão e data/hora do servidor.
- **Finalizacao:** quando cada revisora lacrou a triagem.

## Cuidados

- O link individual **é** a senha. Quem tiver o link de uma revisora pode registrar decisões em nome dela.
- Não execute `setup` em outro projeto para continuar a mesma triagem: isso cria outra planilha e outras chaves.
- Não altere os PMIDs, o lote ou os critérios durante o piloto sem documentar a alteração.
- Esta aplicação serve ao **piloto de calibração** e não substitui a plataforma oficial (Rayyan).

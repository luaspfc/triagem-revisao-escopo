# Triagem-piloto compartilhada — 25 artigos PubMed

**Finalidade:** Luana e Beatriz avaliam a mesma amostra de 25 registros, em navegadores/dispositivos diferentes, utilizando somente seus links individuais. Não existe importação nem exportação manual de JSON. Cada registro é salvo no Google Sheets da responsável pelo aplicativo.

## Como colocar a página no ar (uma vez)

1. Acesse **https://script.google.com/home/projects/create**, faça login em sua conta Google e crie um projeto chamado **Triagem PubMed — Luana e Beatriz**.
2. No editor, substitua todo o conteúdo de `Code.gs` pelo conteúdo do arquivo **Code.gs** deste pacote. Clique em `+` → **HTML**, crie um arquivo de nome **Index** e copie para ele todo o conteúdo de **Index.html**. Salve o projeto.
3. No seletor de funções do editor, selecione **setup** e clique **Executar**. Aceite as permissões necessárias, pois o script cria uma planilha privada para registros e utiliza Google Docs/Drive para produzir o PDF. A execução não deve ser repetida para reiniciar a amostra; repetir a configuração **não** apaga os dados existentes.
4. Clique em **Implantar** → **Nova implantação** → escolha **Aplicativo da Web**. Selecione **Executar como: Eu** e **Quem tem acesso: Qualquer pessoa** (ou outra política que permita o acesso da Beatriz). Clique em **Implantar**. Use a URL final, terminada em `/exec`, e não a URL `/dev` de teste.
5. Volte ao editor e execute a função **mostrarLinks**. Em **Registro de execução** (Execution log), aparecerão **LINK INDIVIDUAL LUANA** e **LINK INDIVIDUAL BEATRIZ**, além do link para a **Planilha de auditoria**.
6. **Envie apenas o LINK INDIVIDUAL BEATRIZ à Beatriz.** Guarde o seu LINK INDIVIDUAL LUANA. Ela abrirá o link e verá sua identidade indicada no início; não precisa baixar, enviar nem importar nenhum arquivo.

> **Importante:** o link individual já contém uma chave de acesso. Não compartilhe o link de uma revisora com a outra. Se alguém tiver acesso ao link, poderá registrar decisões naquela identidade. A planilha não precisa ser compartilhada com a Beatriz. O proprietário controla a conta Google, o código e os dados.

## Como funciona

- Cada revisora visualiza **um artigo por vez**, título, resumo, PMID e metadados da exportação do PubMed.
- Consulte os **critérios PCC** e os códigos **E01–E08** em painel recolhível.
- Marque **Incluir**, **Excluir** ou **Talvez**. Para excluir, selecione um motivo e informe uma justificativa. Para Talvez, descreva a dúvida.
- Clique **Salvar decisão com data e hora**. O servidor registra o horário e mantém o histórico de versões; se sair da página, poderá retomar pelo mesmo link.
- Decisões **Talvez** devem ser revistas e convertidas para Incluir ou Excluir antes de encerrar.
- Depois de 25 decisões finais, clique **Finalizar e lacrar minha triagem**. Essa ação bloqueia alterações para preservar a independência.
- Após **ambas** finalizarem, abra **Verificar relatório conjunto**. A página apresenta a tabela comparativa, divergências, concordância observada, Kappa de Cohen e os limites de 75% e 85%.
- Clique **Gerar relatório PDF** e depois **Abrir ou baixar o PDF gerado**. No iPhone, pode ser necessário tocar em Compartilhar → Salvar em Arquivos.

## Onde ficam os registros?

Na planilha privada gerada automaticamente no Google Drive de quem executou `setup`. A função `mostrarLinks` também imprime seu endereço.

- **Decisoes**: estado atual de cada artigo/revisora.
- **Historico**: todas as gravações, incluindo versões e marcas de tempo.
- **Finalizacao**: data e hora em que cada revisora lacrou a triagem.

## Sobre o piloto

A amostra de **25 PMIDs** é a mesma do arquivo anterior, identificada pelo lote `07258cb162643f64`, sorteada da exportação de **3.481 PMIDs únicos** do PubMed. O sorteio foi feito com a semente `20261102` e não deve ser substituído por artigos-sentinela para relatar a concordância da amostra aleatória.

O protocolo em minuta estabelece **75%** como limiar mínimo, equivalente a pelo menos **19 concordâncias em 25** (76%). A meta adicional solicitada é **superar 85%**, exigindo pelo menos **22 em 25** (88%). **Concordância não equivale a acertos contra gabarito.** Se houver discordâncias, discutir e usar terceiro revisor quando necessário.

Esta aplicação é destinada ao **piloto de calibração** e não substitui a plataforma oficial (Rayyan) prevista nas diretrizes de triagem.

## Limitações

- Requer internet e uma implantação Google Apps Script feita por quem administra o estudo. Os arquivos HTML/GS sozinhos **não constituem um link público funcional**.
- As permissões de publicação podem variar conforme o tipo da conta Google ou as políticas da instituição.
- Por segurança, não execute `setup` em outro projeto para continuar a mesma triagem: isso criará uma planilha separada e novos links.
- A função PDF cria um documento temporário no Google Docs, o converte para PDF e coloca o documento temporário na lixeira. Os registros continuam guardados no Sheets. O PDF gerado é fornecido ao navegador para abrir ou salvar.
- Não altere os 25 PMIDs, o lote ou os critérios durante o piloto sem documentar a alteração, conforme as diretrizes.

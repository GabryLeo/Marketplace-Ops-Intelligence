O `setupApp()` gera dados fictícios inspirados em operações de marketplace:

- pedidos
- produtos
- lojas parceiras
- entregas
- pagamentos
- avaliações
- reclamações
- alertas
- recomendações

O objetivo é demonstrar análise operacional sem expor qualquer informação real.

## Telas

### Panorama

Resumo executivo da operação simulada com KPIs, evolução de vendas e principais sugestões.

### Investigar

Permite explorar dados por filtros e identificar categorias, estados ou lojas com maior impacto.

### Entender causas

Mostra recortes para explicar por que determinado resultado aconteceu.

### Comparar cenários

Compara categorias ou outros recortes, com opção de adicionar múltiplos cenários.

### Pontos de atenção

Lista alertas objetivos com severidade e ação sugerida.

### Sugestões

Cards com recomendações automáticas baseadas nos dados simulados.

### Minhas análises

Área para consultar visões salvas pelo usuário.

### Plano de ação

Registro e acompanhamento de ações criadas manualmente ou a partir de alertas e sugestões.

## Como Rodar

1. Crie uma nova Google Sheet.
2. Abra `Extensoes > Apps Script`.
3. Crie os arquivos `.gs` e `.html` com os mesmos nomes desta pasta.
4. Copie tambem o `appsscript.json` para o manifesto do projeto.
5. Salve o projeto e execute manualmente `setupApp()`.
6. Autorize as permissoes solicitadas.
7. Publique como Web App ou abra pelo `doGet()`.
2. Abra `Extensões > Apps Script`.
3. Crie os arquivos `.gs` no Apps Script usando o conteúdo dos `.js` deste repositório.
4. Crie os arquivos HTML:
   - `Index.html`
   - `App.html`
   - `Views.html`
   - `Styles.html`
5. Copie o conteúdo de `appsscript.json` para o manifesto do Apps Script.
6. Salve o projeto.
7. Execute manualmente:

## Observacoes
```js
setupApp()
```

8. Autorize as permissões.
9. Publique como Web App:

```text
Implantar > Nova implantação > App da Web
```

## Observações

- O login por e-mail é apenas demonstrativo.
- O e-mail serve para separar análises, favoritos e ações.
- Não é autenticação forte.
- O banner do Google Apps Script pode aparecer no Web App publicado.
- Para remover esse banner seria necessário usar outra camada de hospedagem ou publicação.

## Status do Projeto

MVP funcional com foco em portfólio, aprendizado e demonstração de produto analítico.

Principais pontos já implementados:

- experiência desktop e mobile
- dados sintéticos
- recomendações
- plano de ação
- filtros
- comparações
- persistência no Google Sheets

- Todos os dados sao sinteticos e educacionais.
- O app nao usa APIs externas nem dados reais.
- O login por e-mail identifica preferencias, salvos e acoes; nao e autenticacao forte.
- O volume padrao fica em `APP.VOLUME` no arquivo `Utils.gs`.
## Próximas Melhorias

Disclaimer exibido no produto:
- filtros por período
- relatório executivo automático
- exportação CSV/PDF
- ranking de lojas críticas
- ranking de oportunidades
- detalhe por loja/categoria
- histórico de alterações no plano de ação
- campos de prazo e impacto esperado
- gráficos com eixos e legendas mais completos

`DADOS SINTETICOS · PROJETO EDUCACIONAL · NAO OFICIAL`
## Disclaimer

Este projeto é uma simulação educacional.

Não utiliza dados reais, internos ou confidenciais.

Não é afiliado, mantido ou aprovado por qualquer marketplace real.

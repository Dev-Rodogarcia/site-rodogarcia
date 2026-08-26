Concordo com os quatro pontos, com estes ajustes arquiteturais:

1. Cotação: é um bloqueador real. A mutation documentada retorna identificação e status, mas não o preço. O BFF deve ampliar o retorno com `quoteStretchBids { total }` e tratar cotações com múltiplos trechos — exibindo o valor por trecho ou um total consolidado definido explicitamente. A latência precisa ser medida no ambiente ESL antes de assumir experiência síncrona aceitável.

2. Validação de NF: a confirmação é antecipada, sem expor o identificador remoto do ESL ao navegador.

- React envia a chave/número da NF e pelo menos o CNPJ de remetente ou destinatário para um endpoint BFF de validação.
- O BFF consulta o ESL com esse vínculo e devolve somente uma confirmação com capability opaca e curta.
- O React mantém essa capability somente no estado temporário do formulário, sem banco interno, URL ou `localStorage`.
- O agendamento continua permitido sem NF; quando uma NF for anexada, ela precisa estar validada e com a capability ainda válida.
- No envio final, o BFF confere a capability contra os mesmos dados de NF/CNPJ e repete a confirmação no ESL; o ESL continua sendo a autoridade que aceita ou rejeita o vínculo.

Isso torna erros de NF visíveis antes do preenchimento completo sem confiar no navegador para vincular o identificador remoto. A confirmação é repetida no envio final e expira visualmente quando o usuário altera CNPJ, filial, pagador, remetente, destinatário ou a própria NF.

Evitaria criar um identificador interno persistente ou cache durável para essa finalidade: não é necessário e conflita com a diretriz transacional.

3. Fricção: a recomendação é correta, mas a inferência não pode ser automática sem uma regra de negócio confirmada. O usuário autenticado no dashboard não prova, por si só, que ele corresponde ao `payer`, `sender`, `customer` ou à filial ESL correta. O BFF deve obter e fixar apenas as entidades deriváveis com segurança da sessão, perfil e filial selecionada. Os demais devem ser pré-preenchidos, pesquisáveis ou selecionáveis, nunca assumidos silenciosamente.

4. Manutenção e cancelamento: o BFF monta a string final compatível com o ESL e preenche `cancellationDatetime` no servidor. `PATCH /api/collections/:id` e `POST /api/collections/:id/cancel` exigem a capability opaca devolvida na criação no cabeçalho `X-Collection-Capability`; ela é vinculada ao id remoto e expira em 30 dias. O cancelamento usa o `id` remoto ESL — não o `sequenceCode`.

A principal ressalva ao texto é dizer que a persistência já está totalmente resolvida: ela está viável desde que a listagem ESL continue retornando `id`, como a query atual já faz em [GraphQLQueries.java](/C:/Users/suporte/Documents/projetos/etl-dash/etl-extracao-dados/src/main/java/br/com/extrator/integracao/graphql/GraphQLQueries.java:49). Para ações abertas na mesma sessão, o React pode manter o ID remoto em memória; para coletas antigas, a listagem deve recuperá-lo novamente do ESL.

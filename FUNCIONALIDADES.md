# Funcionalidades da Marchetti Solutions

Este documento descreve o comportamento atual da landing page, do portal do cliente e do painel administrativo. Os itens marcados como **limitação** ainda não representam um fluxo integrado de ponta a ponta.

## 1. Landing page

### Conteúdo e navegação

- Apresenta a empresa, seus serviços, diferenciais e informações sobre o fundador.
- Organiza os serviços em categorias: suporte e manutenção, hardware e sistemas, redes e Wi-Fi Mesh, suporte remoto, desenvolvimento web, SLA/monitoramento e atendimento residencial ou empresarial.
- O menu leva às seções **Serviços**, **Sobre** e **Contato**, tanto em desktop como em dispositivos móveis.
- Permite alternar o idioma entre português e inglês.
- Os botões têm estados visuais de interação ao passar o cursor.
- A seção de contato exibe canais e localização da empresa.

### Cadastro de cliente

1. A pessoa seleciona **Criar Conta** ou **Solicitar Atendimento** na landing page.
2. O formulário solicita nome, telefone/WhatsApp, e-mail, senha e confirmação da senha. A senha precisa ter pelo menos oito caracteres.
3. O sistema valida se as senhas coincidem e cria a conta pelo Supabase Auth.
4. Nome e telefone são enviados como metadados. O gatilho do banco cria o perfil correspondente, com papel inicial de cliente.
5. Se a confirmação de e-mail estiver habilitada no Supabase, a interface orienta a pessoa a confirmar o endereço. O link de confirmação retorna ao portal do cliente.
6. Se a confirmação estiver desabilitada, uma sessão é iniciada e a pessoa é encaminhada ao portal.

**Observação:** o botão **Solicitar Atendimento** inicia o cadastro; ele não envia um chamado diretamente pela landing page. Para abrir um chamado, a pessoa deve entrar no portal.

### Login e recuperação de senha

1. A pessoa abre **Portal do Cliente** e informa e-mail e senha.
2. As credenciais são validadas pelo Supabase Auth.
3. Com uma sessão válida, a pessoa é encaminhada para `/client`.
4. Se o e-mail ainda não foi confirmado, a interface informa que é necessário confirmar o endereço.
5. O link **Esqueceu a senha?** abre o fluxo de recuperação de senha.

## 2. Portal do cliente

O portal em `/client` exige uma sessão válida do Supabase. Depois da autenticação, carrega o perfil e os chamados e as faturas associados à conta.

### Solicitar serviços

1. A pessoa escolhe uma categoria de serviço no catálogo do portal.
2. Informa a descrição do problema ou da necessidade.
3. O sistema grava o chamado no Supabase com status inicial **Pendente**.
4. Após a confirmação, o portal abre o histórico de chamados.

### Acompanhar e excluir chamados

- O histórico apresenta número, serviço, data e status do chamado.
- A pessoa pode abrir um chamado para consultar seus detalhes.
- Um chamado só pode ser excluído enquanto estiver **Pendente**. Chamados em andamento ou concluídos não podem ser excluídos pelo cliente.

### Consultar faturas

- Lista as faturas associadas à conta, incluindo descrição, data, valor e status.
- Permite baixar uma representação em PDF da fatura.
- O botão de pagamento abre uma mensagem informativa.

**Limitação:** pagamentos online não estão conectados a um gateway. O portal não solicita nem processa dados de cartão.

### Perfil e endereço

- Permite consultar e editar nome, telefone e informações cadastrais e de endereço.
- As alterações suportadas são salvas no perfil do Supabase.

**Limitação:** o e-mail é exibido no formulário, mas não é alterado por essa tela; ele permanece vinculado à conta de autenticação.

### Preferências e sessão

- Permite alternar português/inglês e tema claro/escuro.
- O comando **Sair** encerra a sessão do Supabase e retorna à página inicial.
- Em telas menores, a navegação usa um menu lateral recolhível.

## 3. Painel administrativo

O painel fica em `/admin` e autentica usuários pelo Supabase Auth. O acesso é concedido conforme o papel armazenado em `profiles`.

### Papéis e permissões

- **Administrador (`admin` / Super Admin):** acessa todas as áreas administrativas.
- **Técnico (`technician`):** tem acesso às áreas de chamados e clientes. As operações de gestão de contas e equipe são protegidas no servidor para administradores.
- Contas sem um papel de equipe autorizado não entram no painel administrativo.

### Visão geral

O dashboard apresenta indicadores de receita recebida, contratos recorrentes (MRR), despesas, valores pendentes, chamados abertos/fechados e clientes. É possível filtrar por mês atual, últimos 30 dias, trimestre, ano ou todo o período. Também há um gráfico de receitas e despesas dos últimos seis meses, consolidado em reais.

### Chamados

Fluxo de atendimento:

1. O administrador ou técnico filtra a lista por status, prioridade, cliente, mês, ano ou texto de busca.
2. Chamados abertos há mais de 24 horas podem gerar alertas de SLA.
3. Ao abrir um chamado, a equipe consulta os dados do cliente e do relato, altera prioridade e status e pode iniciar contato pelo WhatsApp.
4. O administrador pode registrar ou atualizar um orçamento com moeda, valor e observações.
5. O chamado pode ser relacionado a uma fatura.

Os status disponíveis são **Pendente**, **Em andamento** e **Concluído**.

**Limitação:** o painel registra o orçamento e seu status, mas o portal do cliente atualmente não apresenta uma tela para aprová-lo ou recusá-lo. O fluxo de aprovação pelo cliente não está completo.

### Clientes e equipe

- A área de clientes permite pesquisar e consultar perfis, editar dados e remover contas.
- Um administrador pode convidar clientes e colaboradores por e-mail. Para colaboradores, escolhe o papel de administrador ou técnico.
- A edição de cliente atualiza o perfil e os dados cadastrais; a remoção exclui a conta de autenticação correspondente.
- A área de configurações lista os administradores e técnicos, permite enviar convites e remover membros, exceto a própria conta atualmente autenticada.

### Serviços

- Exibe serviços padrão e serviços personalizados cadastrados no painel.
- Permite adicionar serviços personalizados e excluir os personalizados.

**Observação:** esse catálogo administrativo é independente das categorias fixas mostradas no formulário de abertura de chamado do portal do cliente.

### Contratos recorrentes

- Permite criar e editar contratos com cliente, plano/serviço, moeda, valor, ciclo de cobrança, dia de vencimento e observações.
- Permite pausar, reativar e excluir contratos.
- Exibe indicadores de MRR, ARR e contratos que ainda aguardam faturamento no período.
- Permite gerar uma fatura de um contrato ou gerar em lote para contratos ativos.
- A geração verifica se já existe fatura válida para o mesmo contrato e período, evitando duplicidade.

### Faturas

- Permite criar faturas manualmente ou vinculadas a chamados e contratos.
- Permite editar descrição, moeda, valor, vencimento e status.
- Exibe filtros por período, cliente e status, com destaque para faturas vencidas.
- Permite marcar como paga, cancelar, excluir, consultar detalhes, imprimir/baixar PDF e preparar um texto de fatura ou lembrete.
- A marcação de pagamento registra a data e, quando aplicável, congela a taxa de câmbio usada.

**Limitação:** o botão de envio por e-mail abre um formulário com destinatário, assunto e mensagem, mas atualmente não envia a mensagem. O envio transacional de e-mails de cobrança não está integrado.

### Finanças e câmbio

- A área financeira registra receitas e despesas manuais e apresenta totais por BRL, AUD e USD, com filtros por moeda, mês e ano.
- Faturas marcadas como pagas também aparecem como entradas financeiras.
- A área de câmbio consulta cotações externas de AUD e USD em relação ao BRL, permite atualizar as taxas e oferece um conversor.
- Há um simulador de taxas de processamento para estimar valores líquidos; ele não processa pagamentos.
- O histórico registra a taxa congelada quando uma fatura é marcada como paga.

### Relatórios

Disponibiliza relatórios de finanças, faturas, contratos, chamados e clientes. Os filtros variam conforme o tipo e incluem período, moeda e status. Os resultados podem ser exportados em CSV ou impressos/salvos em PDF.

### Configurações

- Mantém dados da empresa usados em documentos, como identificação fiscal, e-mails, localização e instruções de recebimento.
- Permite atualizar nome e e-mail do administrador e definir uma nova senha.
- Mantém os controles de gerenciamento da equipe.

### Notificações e preferências

- As notificações são formadas a partir de chamados, clientes, contratos, faturas e lançamentos financeiros, com atalhos para a área relacionada.
- É possível marcar notificações como lidas.
- O painel permite alternar idioma e tema visual.
- Eventos importantes, como autenticação administrativa, alterações de configurações, cancelamentos e exclusões, podem ser registrados na tabela de auditoria.

## 4. Dados e integrações

- **Supabase Auth:** cadastro, login, recuperação de senha, sessões e convites.
- **`profiles`:** perfil, dados básicos e papel de cada conta.
- **`customer_records`:** chamados e faturas associados ao proprietário.
- **`admin_data`:** configurações e dados administrativos compartilhados, como contratos, serviços e lançamentos.
- O painel também mantém cópias locais em `localStorage` para sincronização e interface. Nem todos os dados legados armazenados anteriormente no navegador são migrados automaticamente.
- Permissões de acesso às tabelas dependem das migrations e políticas RLS aplicadas ao projeto Supabase correspondente.

## 5. Limitações funcionais atuais

1. Pagamento online não está integrado; o portal não coleta dados de cartão.
2. Envio de faturas e lembretes por e-mail não está conectado a um serviço de envio.
3. A aprovação de orçamentos pelo cliente ainda não está disponível no portal.
4. O e-mail da conta do cliente não é editado pelo formulário de perfil do portal.
5. Algumas áreas mantêm dados em `localStorage` como espelho ou estado local; os projetos Supabase devem ter as migrations e as políticas RLS configuradas.

# Marchetti Solutions

Aplicação em Next.js para o site institucional, o portal do cliente e o painel administrativo.

Consulte [FUNCIONALIDADES.md](./FUNCIONALIDADES.md) para os recursos e fluxos de cada área.

## Requisitos

- Node.js 20.9 ou superior
- npm
- Um projeto Supabase de desenvolvimento (separado do projeto de produção)

## Rodar e testar localmente

1. Instale as dependências na pasta do projeto:

```bash
cd marchetti-app
npm ci
```

2. Crie o arquivo local de configuração:

```bash
cp .env.example .env.local
```

3. No painel do **projeto Supabase de desenvolvimento**, abra **Project Settings > API Keys** e preencha `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<chave-do-projeto>
SUPABASE_SECRET_KEY=sb_secret_<chave-secreta-do-servidor>
```

Use os valores reais do seu projeto no lugar dos exemplos. A chave `SUPABASE_SECRET_KEY` só é usada no servidor para operações administrativas; nunca a coloque em uma variável `NEXT_PUBLIC_*`, no código do navegador ou no Git. Não use credenciais de produção para desenvolvimento.

4. Configure o banco de desenvolvimento antes de testar login e dados: no Supabase, abra **SQL Editor** e execute todos os arquivos em `supabase/migrations/` na ordem dos nomes (timestamps). Configure os URLs de redirecionamento em **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`

   Para autenticação por e-mail, configure também o SMTP em **Authentication > SMTP Settings**. O primeiro perfil de administrador deve ser promovido manualmente no SQL Editor depois de criado:

   O cadastro e o login de clientes na landing page usam o Supabase Auth. Com a confirmação de e-mail habilitada, o cliente deve confirmar o link enviado antes de acessar o portal; o link retorna para `/client`. O gatilho da migration cria o perfil do cliente automaticamente.

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@seudominio.com');
```

5. Inicie o servidor local e abra <http://localhost:3000>:

```bash
npm run dev
```

O Next.js carrega `.env.local` automaticamente. Esse comando roda a aplicação localmente, mas usa o projeto Supabase configurado nesse arquivo; para isolar dados, use um projeto Supabase de desenvolvimento.

Antes de enviar alterações, execute as verificações automatizadas:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Publicar em produção com Supabase e Vercel

1. Crie um **projeto Supabase de produção** separado do projeto de desenvolvimento. Em **Project Settings > API Keys**, obtenha a Project URL, a publishable key e uma secret key.
2. Envie o repositório para GitHub, GitLab ou Bitbucket e importe-o na Vercel. Confirme que o framework detectado é Next.js; use `npm ci` para instalar dependências e `npm run build` para o build.
3. Em **Vercel > Settings > Environment Variables**, defina estas variáveis para **Production**:

   | Nome | Valor |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase de produção |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key do Supabase de produção |
   | `SUPABASE_SECRET_KEY` | Secret key do Supabase de produção |

   Mantenha a secret key somente no ambiente do servidor. Configure valores de desenvolvimento/preview separadamente, usando um projeto Supabase não produtivo. As variáveis `NEXT_PUBLIC_*` são incorporadas ao build; depois de alterá-las, faça um novo deployment.
4. No Supabase de produção, execute todos os arquivos em `supabase/migrations/` no **SQL Editor**, na ordem dos nomes (timestamps). Configure **Authentication > URL Configuration** com a URL final do site como **Site URL** e permita os URLs `https://<seu-dominio>/auth/callback`, `https://<seu-dominio>/reset-password` e o domínio Preview da Vercel quando necessário. Configure o SMTP de produção em **Authentication > SMTP Settings**.
5. Faça um deployment Preview com o ambiente não produtivo e teste autenticação, recuperação de senha, permissões de cliente/equipe, convites e persistência. Depois de confirmar o ambiente de produção, configure o domínio na Vercel e faça o deployment de produção.
6. Após a publicação, teste login e recuperação de senha no domínio final. Não compartilhe nem publique a secret key ou a antiga `service_role` key.

## Comandos

```bash
npm run dev       # desenvolvimento local
npm test          # testes automatizados
npm run lint      # lint
npx tsc --noEmit  # checagem de tipos
npm run build     # build de produção
npm run start     # servir o build localmente
```

## Limites atuais

- Pagamentos online não estão conectados a um gateway; o portal informa isso sem coletar dados de cartão.
- Envio de e-mail transacional depende do SMTP configurado no Supabase Auth.
- Dados legados que existiam apenas no `localStorage` de um navegador não são migrados automaticamente para o Supabase.
- O primeiro administrador e as migrations do banco precisam ser configurados antes do uso em cada projeto Supabase.
# marchetti-app

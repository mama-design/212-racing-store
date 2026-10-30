# 212 Racing Store

Sistema móvel de vendas em eventos. Interface em React/Vite no GitHub Pages, login e banco no projeto Supabase exclusivo da 212.

## Funcionalidades

- Eventos, múltiplos vendedores e papéis de administrador/vendedor.
- Cada vendedor consulta apenas suas vendas; administradores consultam toda a operação.
- Código de barras pela câmera do iPhone/Safari ou Android, foto da etiqueta ou digitação.
- Descrição opcional, várias mercadorias por venda, desconto e forma de pagamento.
- Fila local por usuário, sincronização com identificadores únicos e reenvio sem duplicar vendas.
- Relatórios e CSV por evento, vendedor, pagamento e produto/código de barras.
- Criação de usuários pela equipe, com senha inicial escolhida pelo administrador.

## Desenvolvimento

Requer Node.js 22.13 ou superior.

```sh
npm ci
npm run dev
npm run build
```

`dist/` contém o site gerado; `docs/` contém a publicação versionada do GitHub Pages. Ao alterar o aplicativo, execute o build e substitua o conteúdo de `docs/` por `dist/`, preservando `.nojekyll`.

## Publicação

Em Settings → Pages, escolha Deploy from a branch, branch `main`, pasta `/docs`.
O site usa caminhos relativos, funcionando tanto no endereço do repositório quanto no domínio `gestao.212racingstore.com.br`.

Antes de apontar o domínio, configure Custom domain em Settings → Pages e siga os registros indicados pelo GitHub. Não use os registros do ChatGPT Sites para esta publicação.

## Supabase

A função `racing-api`, em `supabase/functions/racing-api/index.ts`, valida a sessão pelo Supabase Auth, consulta o cadastro de equipe e verifica as permissões em todas as operações. A função deve ser publicada com validação JWT feita em seu próprio corpo (`verify_jwt = false` no gateway).

As tabelas têm RLS habilitado e acesso direto revogado para `anon` e `authenticated`. A aplicação acessa os dados exclusivamente pela função. A chave `service_role` é usada somente no servidor, a partir do ambiente fornecido pelo Supabase, e não faz parte deste repositório. A chave publishable no cliente identifica o projeto e não concede acesso às tabelas.

`supabase/schema.sql` documenta o esquema inicial, já aplicado ao projeto. Não o reaplique em um banco com essas tabelas. Alterações futuras devem usar novas migrações.

Em Authentication → URL Configuration, autorize os endereços do GitHub Pages e do domínio próprio antes de utilizar confirmação e recuperação de senha por e-mail. O envio de mensagens depende da configuração SMTP do projeto.

## Uso sem conexão

Cada celular precisa entrar e abrir o aplicativo com internet antes do evento. Aguarde a indicação de preparo offline. As vendas pendentes ficam somente naquele navegador até sincronizar. Não limpe os dados do navegador e não troque de domínio enquanto houver pendências. Os domínios antigo e novo têm armazenamentos locais separados.

Antes do primeiro evento, teste leitura de uma etiqueta, registro sem internet, reconexão e conferência do relatório em cada celular que será usado.

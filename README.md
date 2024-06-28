# Documentação do WeebChat

## Sumário

1. [Introdução](#introdução)
2. [Instalação](#instalação)
   - [Instalando o Bun](#instalando-o-bun)
   - [Instalando as Dependências](#instalando-as-dependências)
3. [Execução do Projeto](#execução-do-projeto)
   - [Executando o Servidor](#executando-o-servidor)
   - [Executando o Cliente](#executando-o-cliente)
4. [Comandos Disponíveis](#comandos-disponíveis)
   - [Comandos Gerais](#comandos-gerais)
   - [Exemplo de Uso](#exemplo-de-uso)
5. [Regras de Negócio](#regras-de-negócio)
6. [Estrutura do Projeto](#estrutura-do-projeto)

## Introdução

WeebChat é uma aplicação de chat baseada em WebSockets que permite a criação e gerenciamento de salas de chat. Cada sala é identificada por uma cor única, e os usuários podem enviar mensagens privadas ou gerais, além de criar novas salas ou listar as existentes.

## Instalação

Para instalar e executar o WeebChat, você precisará do Bun, um bundler, transpiler e executor rápido para JavaScript e TypeScript.

### Instalando o Bun

1. Acesse o [site oficial do Bun](https://bun.sh).
2. Siga as instruções de instalação para o seu sistema operacional.

### Instalando as Dependências

Após instalar o Bun, clone este repositório e instale as dependências:

```sh
git clone <url-do-repositorio>
cd <nome-do-repositorio>
bun install
```

## Execução do Projeto

### Executando o Servidor

Para iniciar o servidor WebSocket, utilize o comando:

```sh
bun run server.ts
```

### Executando o Cliente

Para iniciar um cliente WebSocket, utilize o comando em um terminal separado:

```sh
bun run client.ts
```

## Comandos Disponíveis

### Comandos Gerais

- `/create <nome-da-sala>`: Cria uma nova sala com o nome especificado.
- `/join <nome-da-sala>`: Entra em uma sala existente.
- `/exit`: Sai da sala atual e volta para a sala `all`.
- `/list`: Lista todas as salas existentes e o número de usuários em cada uma.
- `/who`: Lista os usuários na sala atual.
- `/w <id-usuario> <mensagem>`: Envia uma mensagem privada para o usuário especificado.

### Exemplo de Uso

```sh
/create myroom
/join myroom
/exit
/list
/who
/w f8aca74d Olá, como vai?
```

## Regras de Negócio

1. **Identificação de Usuários**:
   - Cada usuário recebe um ID único ao se conectar, exibido como o primeiro bloco de um UUID.
   - O ID do usuário é colorido para fácil identificação.

2. **Gerenciamento de Salas**:
   - A sala `all` é a sala padrão e possui uma cor fixa (vermelho).
   - Novas salas podem ser criadas com o comando `/create <nome-da-sala>`.
   - Um usuário pode entrar em uma sala existente com o comando `/join <nome-da-sala>`.
   - Um usuário pode sair da sala atual e voltar para `all` com o comando `/exit`.
   - Todas as salas têm uma cor única, exceto `all`.

3. **Envio de Mensagens**:
   - Mensagens enviadas em uma sala são visíveis apenas para os usuários dessa sala.
   - Mensagens privadas podem ser enviadas com o comando `/w <id-usuario> <mensagem>`.

4. **Notificações**:
   - Quando um usuário entra ou sai de uma sala, todos na sala são notificados.
   - A criação de uma nova sala é notificada para todos na sala `all`.

## Estrutura do Projeto

```plaintext
weebchat/
├── client.ts
├── server.ts
├── package.json
└── tsconfig.json
```

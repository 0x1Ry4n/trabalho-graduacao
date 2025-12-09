# UniPass Mobilidade — Context

## Project Overview

UniPass Mobilidade é um aplicativo mobile para controle das carteirinhas dos alunos que utilizam os ônibus da **Asseumir – Associação de Estudantes Universitários de Mirassol**.

O sistema foi criado para resolver problemas recorrentes no transporte estudantil, como:

- Uso indevido do ônibus por alunos inadimplentes
- Conflitos na verificação de pagamentos
- Falta de controle centralizado das matrículas

O projeto digitaliza e centraliza todo o controle de alunos, pagamentos, rotas e validação das carteirinhas.

---

## Objective

Centralizar e digitalizar o controle de:

- Matrículas
- Pagamentos
- Validação de carteirinhas

Oferecendo maior:

- Segurança
- Transparência
- Agilidade

Para:

- Alunos
- Motoristas
- Administração da associação.

---

## System Modules

O sistema é composto por três aplicações principais:

### 1. Aplicativo do Aluno (Mobile)

Permite que o aluno gerencie sua relação com o transporte universitário.

Funcionalidades:

- Login do aluno
- Pagamento da mensalidade
- Histórico de mensalidades pagas
- Rematrícula online
- Consulta de pontos de parada
- Visualização das rotas
- Envio de reclamações e sugestões

---

### 2. Aplicativo do Motorista (Mobile)

Aplicativo utilizado para validação das carteirinhas no momento do embarque.

Funcionalidades:

- Login do motorista
- Leitura de QR Code da carteirinha
- Verificação do status da matrícula
- Funcionamento **offline**
- Sincronização automática quando houver internet

---

### 3. Painel Administrativo (Web)

Sistema utilizado pela administração da associação para gerenciar toda a operação.

Funcionalidades:

- Gestão de alunos
- Gestão de motoristas
- Gestão de veículos
- Controle de pagamentos
- Configuração de pontos de parada
- Gerenciamento de rotas
- Acompanhamento de matrículas e rematrículas

---

## Architecture Overview

Arquitetura baseada em API centralizada.

Componentes principais:

Mobile Apps

- Aplicativo do aluno
- Aplicativo do motorista

Web App

- Painel administrativo

Backend

- API RESTful
- Autenticação JWT
- Processamento assíncrono de eventos

Database

- PostgreSQL

---

## Offline Operation (Driver App)

O aplicativo do motorista deve funcionar mesmo sem internet.

Estratégia:

- Armazenamento local de dados (SQLite)
- Cache de alunos autorizados
- Validação local da matrícula
- Registro de eventos offline
- Sincronização automática quando houver conexão

Backend:

- Fila de eventos
- Jobs de processamento
- Consistência eventual de dados

---

## Technologies

### Web Admin Panel

React.js

### Mobile Apps

React Native

### Backend

Node.js

### Database

PostgreSQL

---

## License

Projeto acadêmico/associativo com uso restrito à Asseumir.

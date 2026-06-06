# UniPass Mobilidade

Aplicativo mobile para controle das carteirinhas dos alunos que utilizam os ônibus da **Asseumir – Associação de Estudantes Universitários de Mirassol**.

O projeto surge da necessidade real de resolver problemas recorrentes no transporte estudantil, como uso indevido do ônibus por alunos inadimplentes e conflitos na verificação de pagamentos.

## 🎯 Objetivo

Centralizar e digitalizar o controle de matrículas, pagamentos e validação de carteirinhas, oferecendo mais segurança, transparência e agilidade para alunos, motoristas e administração da associação.

## 📱 Funcionalidades do Aplicativo (Aluno)

- Login do aluno
- Pagamento da mensalidade
- Visualização do histórico de mensalidades pagas
- Consulta de pontos de parada
- Visualização de rotas definidas pela associação

## 🚍 Funcionalidades do Aplicativo (Motorista)

- Login do motorista
- Leitura de QR Code da carteirinha do aluno
- Validação da matrícula do aluno
- Sincronização automática quando houver conexão com a internet

## 🔄 Funcionamento Offline (Motorista)

Para garantir a validação das carteirinhas mesmo sem conexão com a internet:

- Armazenamento local no app com SQLite
- Sincronização assíncrona

## 🖥️ Painel Administrativo

- Gestão de alunos e acompanhamento de matrículas
- Gestão de motoristas e de veículos
- Controle de pagamentos e tabela de preços
- Gerenciamento de rotas e configuração de pontos de parada

## 💵 Geração das mensalidades pendentes

Para geração das mensalidades no primeiro dia do mês:

- Jobs e fila de eventos no backend com BullMQ para geração de mensalidades e processamento de validações de carteirinha pendentes

## 🛠️ Tecnologias Utilizadas

### Mobile

- React Native
- SQLite
- Native base lib
- Expo Go

### Backend

- Node.js
- PostgreSQL
- Redis para caching e filas
- BullMQ e BullBoard para jobs e filas
- Docker e docker compose (api e banco de dados PostgreSQL)

## 📐 Arquitetura Backend (Visão Geral)

- API RESTful no backend
- Autenticação por cookie de sessão e token JWT
- Sincronização eventual para operações offline
- Cronjobs e filas de eventos

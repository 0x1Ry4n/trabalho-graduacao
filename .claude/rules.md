# UniPass Mobilidade — Development Rules

## General Principles

- Código deve ser claro, legível e modular.
- Evitar lógica de negócio no frontend.
- Toda regra de negócio deve estar no backend.
- APIs devem ser RESTful e consistentes.
- Evitar duplicação de código.

---

## Backend Rules

Tecnologia: Node.js

Regras:

- Separar camadas:
  - controllers
  - services
  - repositories
  - models

- Não acessar banco diretamente em controllers.
- Toda regra de negócio deve estar em services.
- Validar entradas de dados.
- Usar JWT para autenticação.

---

## Database Rules

Banco: PostgreSQL

Regras:

- Usar chaves primárias UUID ou serial.
- Definir índices para consultas frequentes.
- Usar foreign keys para integridade referencial.
- Evitar consultas N+1.

Entidades principais:

- alunos
- motoristas
- veículos
- rotas
- pontos_de_parada
- pagamentos
- matriculas

---

## Mobile Rules

Tecnologia: React Native

Regras:

- Componentes reutilizáveis.
- Separar:
  - UI
  - serviços de API
  - estado da aplicação
- Não colocar lógica complexa nas telas.
- Garantir funcionamento offline no app do motorista.

---

## Offline Sync Rules

- Dados essenciais devem ser armazenados localmente.
- Sincronização deve ser resiliente.
- Utilizar filas de eventos para sincronização.
- Resolver conflitos de forma previsível.

---

## Security Rules

- Autenticação via JWT.
- Proteção de rotas administrativas.
- Validação de permissões no backend.
- Sanitização de entradas.

---

## Code Quality

- Usar padrões de arquitetura.
- Manter funções pequenas e testáveis.
- Evitar arquivos muito grandes.
- Priorizar legibilidade do código.

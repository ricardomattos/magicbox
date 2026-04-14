# Magic Box — CLAUDE.md

Guia de contexto para o assistente. Leia antes de qualquer tarefa.

---

## O que é este projeto

**Magic Box Cross Training** é um sistema de gestão de academia (SaaS) para a Magic Box em Araraquara, Brasil. Funcionalidades principais:

- Check-in em aulas (hoje/amanhã, por horário)
- Controle de mensalidade (pagamento mensal por aluno)
- Gestão de horários (templates semanais → slots diários auto-gerados)
- Dois papéis: **aluno** e **gestor** (coach/admin)
- PWA instalável no celular

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + PWA |
| Backend | Django 4.2 + DRF + SimpleJWT |
| Banco | MySQL 8.0 |
| Infra dev | Docker Compose |
| Infra prod | Docker Compose + Nginx + Gunicorn |

---

## Estrutura do projeto

```
magicbox/
├── backend/
│   ├── magicbox/          # settings, urls, wsgi
│   └── apps/
│       ├── users/         # Auth, modelo User customizado, roles
│       ├── horarios/      # Templates semanais, slots diários, checkins
│       ├── planos/        # Planos de assinatura, pagamentos
│       └── config_box/    # Config global da box (singleton)
├── frontend/
│   └── src/
│       ├── api/           # client.js (JWT + refresh) + index.js (endpoints agrupados)
│       ├── hooks/         # useAuth, useFetch
│       ├── components/    # ui.jsx — biblioteca inteira em um arquivo
│       └── pages/
│           ├── auth/      # LoginPage, FirstAccessPage
│           ├── aluno/     # AlunoShell, HomePage, AgendaPage, CheckinPage, PlanoPage
│           └── gestor/    # GestorShell, HorariosPage, AlunosPage, PlanosPage, ConfigPage
├── nginx/
├── mysql/
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── Makefile
└── .env.example
```

---

## Comandos do dia a dia

```bash
make dev              # Sobe o stack de desenvolvimento (db + backend + frontend)
make dev-d            # Idem, em background
make down             # Para todos os containers

make migrate          # Aplica migrations pendentes
make makemigrations   # Detecta mudanças nos models
make seed             # Popula banco com dados de exemplo
make createsuperuser  # Cria superusuário Django

make logs             # Segue logs de todos os containers
make logs-backend     # Apenas o backend Django
make shell-backend    # Shell Python (manage.py shell)
make shell-db         # MySQL CLI
```

**Portas (dev):**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api`
- Django Admin: `http://localhost:8000/admin`

---

## Variáveis de ambiente

Copiar `.env.example` → `.env` para produção. Em dev, os valores já estão no `docker-compose.dev.yml`.

| Variável | Descrição |
|----------|-----------|
| `DJANGO_SECRET_KEY` | Chave secreta Django |
| `DB_NAME / DB_USER / DB_PASSWORD` | Credenciais MySQL |
| `ALLOWED_HOSTS` | IP ou domínio (sem protocolo) |
| `CORS_ALLOWED_ORIGINS` | Origens permitidas pelo CORS |
| `VITE_API_URL` | URL base da API usada pelo browser |

---

## Autenticação

- JWT via SimpleJWT: access token (1 dia), refresh token (30 dias, rotativo)
- Tokens guardados no `localStorage`: `mb_access`, `mb_refresh`, `mb_user`
- `client.js` faz refresh automático em 401 com fila para evitar race conditions
- Primeiro login força troca de senha (`must_change_pass` no model User)

---

## Modelo de dados (resumo)

| Model | App | Descrição |
|-------|-----|-----------|
| `User` | users | AbstractBaseUser; role `aluno` ou `gestor`; `must_change_pass`; FK para Plano |
| `Plano` | planos | Tiers de assinatura (nome, preço) |
| `Pagamento` | planos | Um registro = um mês pago (`YYYY-MM`) por aluno |
| `HorarioTemplate` | horarios | Template semanal (weekday 0–6, hora, vagas) |
| `Horario` | horarios | Slot concreto para uma data específica (gerado lazy a partir do template) |
| `Checkin` | horarios | Inscrição de aluno em um slot; `ativo` flag (soft delete) |
| `BoxConfig` | config_box | Singleton: `checkin_release_hour`, `coach_msg` |

---

## Padrões e convenções

### Backend
- Apps são independentes por domínio — evitar imports circulares entre apps
- Views usam permissão customizada `IsGestor` para endpoints de coach
- Slots de horário são gerados de forma lazy na primeira consulta de uma data
- Pagamentos são imutáveis — um registro por mês pago, sem update
- Timestamps com `auto_now_add` (sem `updated_at`; registros são imutáveis por design)

### Frontend
- Todo o estado global de auth fica em `useAuth()` (AuthContext)
- Biblioteca de UI inteira em `src/components/ui.jsx` — adicionar novos componentes lá
- Cores e tema via objeto `C` importado de `ui.jsx` — nunca hardcodar hex inline
- Responsividade via hook `useIsMobile()` + styles inline condicionais
- Sem arquivos CSS separados — tudo inline
- Strings voltadas ao usuário em **português**

### API (endpoints relevantes)
```
POST   /api/auth/login/                    Login → tokens JWT
POST   /api/auth/refresh/                  Renova access token
GET    /api/users/me/                      Usuário logado
GET    /api/horarios/?data=YYYY-MM-DD      Slots do dia (gera lazy)
POST   /api/horarios/<id>/checkin/         Faz check-in (valida pagamento)
DELETE /api/horarios/<id>/checkin/         Cancela check-in
GET    /api/planos/pagamentos/<userId>/    Meses pagos do aluno
POST   /api/planos/pagamentos/<userId>/    Toggle pagamento de um mês
GET/PATCH /api/config/                     Config global da box
```

---

## Dados de exemplo (seed)

```
Coach:   coach@magic.com   / admin123
Aluno 1: aluno1@magic.com  / aluno123   (mensalidade paga)
Aluno 2: aluno2@magic.com  / aluno123   (mensalidade em aberto)
```

---

## Deploy em produção

```bash
cp .env.example .env   # Preencher todas as variáveis
make prod              # Sobe Nginx + Gunicorn + MySQL em background
```

Nginx serve o frontend estático em `/` e faz proxy de `/api/*` para o Gunicorn.
Para HTTPS, usar Certbot + Let's Encrypt após subir o stack.


## Deploy no droplet (digitalocean)

Quando eu te pedir para fazer deploy no droplet, siga os seguintes passos:

**Frontend:** build local → rsync para o servidor → git pull → restart nginx
```bash
# 1. Build local (rodar dentro de frontend/)
VITE_API_URL=http://137.184.109.56/api npm run build

# 2. Enviar dist para o servidor (usar rsync, NÃO scp -r)
rsync -av --delete dist/ root@137.184.109.56:/opt/magicbox/frontend/dist/

# 3. No servidor: git pull + restart
ssh root@137.184.109.56 "cd /opt/magicbox && git pull origin main && docker compose -f docker-compose.prod.yml restart nginx"
```

**Backend:** git pull + restart do container backend
```bash
ssh root@137.184.109.56 "cd /opt/magicbox && git pull origin main && docker compose -f docker-compose.prod.yml restart backend"
```

> **Notas:**
> - Usar `rsync -av --delete dist/ ...dist/` para enviar o frontend — `scp -r dist/` cria uma pasta `dist/dist/` aninhada se o destino já existir
> - Usar `docker compose` (sem hífen) — o servidor tem Docker Compose v2
> - O frontend é servido pelo serviço `nginx` (não existe serviço `frontend`)
> - Serviços disponíveis em prod: `db`, `backend`, `nginx`

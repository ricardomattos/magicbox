# Magic Box Cross Training — Monorepo

App de gerenciamento de aulas, check-ins e mensalidades para o Magic Box Cross Training de Araraquara.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + PWA |
| Backend | Django 4.2 + DRF + SimpleJWT |
| Banco | MySQL 8.0 |
| Proxy | Nginx (produção) |
| Infra | Docker Compose |

---

## Início rápido (Mac / Linux)

### Pré-requisitos
- Docker Desktop instalado e rodando
- `make` disponível (já vem no Mac com Xcode CLT)

### 1. Clone e configure

```bash
git clone <seu-repo> magicbox
cd magicbox
```

### 2. Suba o ambiente de desenvolvimento

```bash
make dev
```

Isso irá:
- Subir MySQL 8 (porta 3306)
- Subir Django com hot-reload (porta 8000)
- Subir Vite dev server (porta 5173)
- Rodar `migrate` automaticamente na primeira vez

### 3. Popule com dados de exemplo

```bash
make seed
```

Contas criadas:
| E-mail | Senha | Papel |
|--------|-------|-------|
| coach@magic.com | admin123 | Gestor |
| ana@magic.com | ana123 | Aluna (paga) |
| carlos@magic.com | carlos123 | Aluno |
| juliana@magic.com | juliana123 | Aluna |
| rafael@magic.com | rafael123 | Aluno (1º acesso) |

### 4. Acesse

- **App:** http://localhost:5173
- **API:** http://localhost:8000/api
- **Admin Django:** http://localhost:8000/admin

---

## Comandos úteis

```bash
make dev              # Sobe tudo em modo desenvolvimento
make dev-d            # Sobe em background (detached)
make down             # Para todos os containers
make migrate          # Roda migrations
make makemigrations   # Gera novas migrations
make createsuperuser  # Cria superusuário Django
make seed             # Popula banco com dados de exemplo
make logs             # Acompanha todos os logs
make logs-backend     # Só logs do Django
make shell-backend    # Shell Python do Django
make shell-db         # MySQL CLI
```

---

## Produção

### 1. Configure variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com seus valores reais
```

### 2. Suba

```bash
make prod
```

O Nginx vai servir:
- `/` → build do React (PWA)
- `/api/` → proxy para Django/Gunicorn
- `/staticfiles/` → arquivos estáticos do Django

### Domínio

Quando tiver seu domínio, edite `nginx/nginx.prod.conf`:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

Para HTTPS, recomendamos usar [Certbot](https://certbot.eff.org/) com Let's Encrypt.

---

## Estrutura do projeto

```
magicbox/
├── Makefile
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.example
├── nginx/
│   └── nginx.prod.conf
├── mysql/
│   └── init.sql
├── backend/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── requirements.txt
│   ├── manage.py
│   ├── magicbox/          # settings, urls, wsgi
│   └── apps/
│       ├── users/         # auth, JWT, alunos, gestor
│       ├── horarios/      # templates semanais, slots, check-ins
│       ├── planos/        # planos e pagamentos mensais
│       └── config_box/    # configurações do box (singleton)
└── frontend/
    ├── Dockerfile.dev
    ├── Dockerfile.prod
    ├── vite.config.js     # PWA configurado
    ├── index.html
    └── src/
        ├── api/           # cliente fetch + módulos por domínio
        ├── hooks/         # useAuth, useFetch
        ├── components/    # ui.jsx (todos os componentes compartilhados)
        └── pages/
            ├── auth/      # Login, FirstAccess
            ├── aluno/     # Home, Agenda, Checkin, Plano
            └── gestor/    # Horarios, Alunos, Planos, Config
```

---

## API — Endpoints principais

```
POST   /api/auth/login/                    Login (retorna JWT)
POST   /api/auth/refresh/                  Refresh token

GET    /api/users/me/                      Dados do usuário logado
POST   /api/users/me/change-password/      Trocar senha
GET    /api/users/                         Listar alunos (gestor)
POST   /api/users/                         Criar aluno (gestor)
PATCH  /api/users/<id>/                    Editar aluno (gestor)
POST   /api/users/<id>/reset-password/     Resetar senha (gestor)

GET    /api/horarios/?data=YYYY-MM-DD      Slots do dia
POST   /api/horarios/<id>/checkin/         Fazer check-in
DELETE /api/horarios/<id>/checkin/         Liberar vaga
GET    /api/horarios/templates/            Grade semanal (gestor)
POST   /api/horarios/templates/replicar/   Replicar dia para semana

GET    /api/planos/                        Listar planos
GET    /api/planos/pagamentos/<userId>/    Meses pagos do aluno
POST   /api/planos/pagamentos/<userId>/    Toggle pagamento de um mês

GET    /api/config/                        Config do box
PATCH  /api/config/                        Atualizar config (gestor)
```

# APEX — Workout Tracker 🔥

Uma plataforma completa de gestão de treinos e exercícios, construída com Next.js 15, Firebase e design premium inspirado em Nike Training + Strava.

---

## ✨ Funcionalidades

### Autenticação
- Login com email/senha e Google
- Cadastro de conta
- Recuperação de senha
- **Sessão persistente** — o usuário fica logado automaticamente ao reabrir o app
- Rotas protegidas

### Exercícios
- Cadastro completo com todos os campos (categoria, grupo muscular, séries, reps, carga, descanso, equipamentos, vídeo, tags)
- Importação via JSON com validação Zod, preview e detecção de duplicados
- Busca e filtros por categoria

### Fichas de Treino
- Criação visual com drag-and-drop (Framer Motion Reorder)
- Configuração de séries, repetições e carga por exercício
- Divisão por dias da semana
- Diferentes tipos: A/B/C/D, Full Body, PPL, etc.
- Duplicar e compartilhar treinos

### Modo Treino (Train Mode)
- Interface fullscreen imersiva
- Timer de série e descanso automático
- Progresso visual com barra e indicadores de série
- Concluir série, pular exercício, pausar/retomar
- Cronômetro global do treino
- Tela de conclusão com XP, calorias e duração

### Dashboard
- Heatmap de atividade estilo GitHub (12 semanas)
- Estatísticas: treinos, horas, exercícios, fichas
- Barra de progresso de nível/XP
- Ações rápidas para iniciar treino
- Histórico de sessões recentes

### Progresso
- Gráficos semanais de treinos e minutos (Recharts)
- Evolução de peso e % gordura
- Registro de métricas corporais
- Histórico completo

### Perfil
- Foto com upload direto
- Bio, idade, altura, peso, objetivo, nível
- Badges e conquistas (gamificação)
- XP e nível visual

### Social
- Seguir outros usuários
- Perfis públicos
- Curtir e copiar treinos públicos

### Gamificação
- Sistema de XP por treino
- Níveis e nomes (Iniciante → Imortal)
- Badges por conquistas (common, rare, epic, legendary)
- Streak de dias consecutivos

---

## 🚀 Como rodar o projeto

### Pré-requisitos
- Node.js 18+
- Conta no Firebase

### 1. Clone e instale

```bash
git clone <repo>
cd workout-tracker
npm install
```

### 2. Configure o Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Crie um novo projeto
3. Ative:
   - **Authentication** → Email/Password e Google
   - **Firestore Database** (modo produção)
   - **Storage**
4. Em Project Settings > Your apps > Adicione Web App
5. Copie as credenciais

### 3. Configure variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com suas credenciais do Firebase.

### 4. Configure as regras do Firestore

No Firebase Console > Firestore > Regras, cole o conteúdo de `firestore.rules`.

### 5. Configure as regras do Storage

No Firebase Console > Storage > Regras, cole o conteúdo de `storage.rules`.

### 6. Rode o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Estrutura do Projeto

```
workout-tracker/
├── app/
│   ├── auth/
│   │   ├── login/          # Tela de login
│   │   ├── register/       # Cadastro
│   │   └── forgot-password/
│   ├── dashboard/          # Dashboard principal
│   ├── exercises/
│   │   ├── new/            # Cadastrar exercício
│   │   └── import/         # Importar JSON
│   ├── workouts/
│   │   ├── new/            # Criar ficha
│   │   └── [id]/           # Detalhe/editar ficha
│   ├── train/[id]/         # Modo treino (fullscreen)
│   ├── progress/           # Dashboard de progresso
│   ├── profile/
│   │   └── [id]/           # Perfil público
│   └── settings/           # Configurações
├── components/
│   └── shared/             # Skeleton, EmptyState, XPBadge
├── firebase/
│   └── config.ts           # Firebase init + persistência
├── hooks/
│   └── index.ts            # useExercises, useWorkouts, useTimer, etc.
├── lib/
│   └── utils.ts            # cn(), formatters, constantes
├── services/
│   ├── exercises.ts        # CRUD exercícios
│   ├── workouts.ts         # CRUD treinos
│   ├── sessions.ts         # Sessões e métricas
│   └── gamification.ts     # XP, badges, níveis
├── store/
│   ├── AuthContext.tsx     # Contexto de autenticação
│   └── trainStore.ts       # Zustand — estado do treino ativo
└── types/
    └── index.ts            # TypeScript interfaces completas
```

---

## 🎨 Stack Tecnológica

| Tecnologia | Uso |
|-----------|-----|
| Next.js 15 (App Router) | Framework principal |
| TypeScript | Tipagem |
| Tailwind CSS | Estilização |
| Framer Motion | Animações e drag-and-drop |
| Firebase Auth | Autenticação com persistência |
| Firestore | Banco de dados |
| Firebase Storage | Fotos e uploads |
| Zustand | Estado global (modo treino) |
| React Hook Form + Zod | Formulários com validação |
| Recharts | Gráficos de progresso |
| date-fns | Manipulação de datas |

---

## 🔮 Próximas Funcionalidades

- [ ] Notificações push via Service Worker
- [ ] Exportação de progresso em PDF
- [ ] Modo coach com planos de treino para alunos
- [ ] Feed social com atividades dos seguidos
- [ ] Integração com Apple Health / Google Fit
- [ ] Progressão automática de carga com IA
- [ ] Modo offline com sync
- [ ] Desafios semanais entre usuários

---

## 📄 Licença

MIT
"# alphatreine" 

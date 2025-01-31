# pennysave.ai

AI enhanced tool for personal finance managament

## Getting Started

First, run the development server along with websocket server:

```bash
npm run dev
```

Second run a db locally (you need docker to be installed)

```bash
npm run run start:db
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Commands

#### Create and apply new db migration in dev

```bash
npm run run prisma:migrate:db
```

#### Check prod migration status

```bash
npm run dotenv -e .env.prod prisma migrate status
```

#### Roll back corrupted migration in prod i.e.

```bash
npm run dotenv -e .env.prod -- prisma migrate resolve --rolled-back 20250130212937_support_multiple_plaid_links_token
```

#### Apply migrations in prod

```bash
npm run dotenv -e .env.prod prisma migrate deploy
```

#### Populate db

```bash
npm run populate:db:dev
```

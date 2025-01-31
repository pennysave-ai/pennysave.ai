This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server along with websocket server:

```bash
npm run dev
```

Second run a db locally (you need docker to be installed)

```bash
npm run start:db
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# Commands

Create and apply new db migration

```bash
npm run prisma:migrate:local
```

Check prod migration status

```
npx dotenv -e .env.prod prisma migrate status
```

Roll back corrupted migration in prod
ex

```
npx dotenv -e .env.prod -- prisma migrate resolve --rolled-back 20250130212937_support_multiple_plaid_links_token
```

Apply migrations in prod

```
npx dotenv -e .env.prod prisma migrate deploy
```

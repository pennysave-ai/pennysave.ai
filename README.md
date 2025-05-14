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

#### Run ngrok

```bash
ngrok http 3000
```

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
npm run prisma:migrate:prod
```

#### Populate db

```bash
npm run populate:db:dev
```

#### Run Stripe Server

Start ngrok first

```bash
ngrok http 3000
```

copy started ngrok adress and paste it in env.local file
run stripe

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

# TODO

When it's gonna be possible and thre will be stable cash flow we need to update current vercel plan to a pro (https://vercel.com/pricing) to support more than two cron jobs. After we can add the following job to a vercel.json file to update currency automatically.

```json
 {
      "path": "/api/webhooks/cron/update-exchange-rates",
      "schedule": "0 17 * * *"
},
```

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
npm run populate_currency:db:dev
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

# Run instance on Run Pod no-op because we are using huggingface models

The image of llama4:scout is already on Docker registry so all you need to do:

- pick the right pod `H100 SXM` or more expensive (i've experimented with one GPU count for 2.99 an hour)
- select my ollama image template and wait until it's running
- ferify if it's working by calling this curl
- copy the dedicated URL from runpod i.e https://yw29tyyn37d999-3000.proxy.runpod.net/generate to a `LLM_API_URL` env variable and redeploy the project
- call GET pennysave.ai/api/webhooks/cron/fill-monthly-reports to generate reports
- call GET pennysave.ai/api/webhooks/cron/send-reports you can use postman collection with PROD Env

```bash
curl --location 'https://927kk139p5wgqc-3000.proxy.runpod.net/generate' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer ...' \
--data-raw '{
  "model": "llama4:scout",
  "system": "You are a professional friendly and fun financial assistant specializing in personal finances.",
  "prompt": "Analyze my transactions, budgets, spending, and earnings for the given month and tell me a story about them. Find an insights and the most impactfull information. Do not include expenses breakdown in the report. Skip the greeting part. Be fully transparent and provide accurate information using frendly fun and engaging language. Give me a summary of my financial status and suggest ways to improve it. Do not include any recomendations on expence tracking apps or services. Return the result as JSON. Use the following data for a report: {\"userId\":\"79e488c4-4187-4a66-ac2c-b66b1852711e\",\"email\":\"mike.zhylevych@gmail.com\",\"currencySymbol\":\"$\",\"currencyName\":\"USD\",\"income\":2200,\"expenses\":-485,\"netFlow\":1715,\"reportDate\":\"May 2025\",\"transactions\":[{\"amount\":\"-$100.00\",\"category\":\"AWS\",\"payee\":\"\",\"notes\":\"hosting\",\"account\":\"Success\"},{\"amount\":\"-$200.00\",\"category\":\"Gasoline\",\"payee\":\"\",\"notes\":\"Repsol\",\"account\":\"Success\"},{\"amount\":\"-$25.00\",\"category\":\"Apartments\",\"payee\":\"\",\"notes\":\"\",\"account\":\"Success\"},{\"amount\":\"$2,200.00\",\"category\":\"Apartments\",\"payee\":\"\",\"notes\":\"\",\"account\":\"Success\"},{\"amount\":\"-$10.00\",\"category\":\"Gasoline\",\"payee\":\"\",\"notes\":\"\",\"account\":\"Success\"},{\"amount\":\"-$50.00\",\"category\":\"Gasoline\",\"payee\":\"\",\"notes\":\"\",\"account\":\"Success\"},{\"amount\":\"-$100.00\",\"category\":\"Uncategorized\",\"payee\":null,\"notes\":\"Rocket Deliveries\",\"account\":\"Success\"}]}",
  "stream": false,
  "format": {
    "type": "object",
    "properties": {
      "insights": {
        "type": "string",
        "description": "Summary on my finances insights"
      },
      "income_analysis": {
        "type": "string",
        "description": "Analysis on my income"
      },
      "expense_analysis": {
        "type": "string",
        "description": "Analysis on my expences"
      },
      "health": {
        "type": "string",
        "enum": ["green", "yellow", "red"]
      },
      "health_analysis": {
        "type": "string",
        "description": "Summary on my financial health"
      }
    },
    "required": [
      "insights",
      "income_analysis",
      "expence_analysis",
      "health",
      "health_analysis"
    ]
  }
}'
```

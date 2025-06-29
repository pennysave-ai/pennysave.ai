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

Producthunt description:
Managing personal finances can be overwhelming, especially with the increasing complexity of modern life. Our money management portal was created to empower individuals to take control of their financial future with confidence and ease. We saw a need for a platform that not only simplifies budgeting and expense tracking but also provides meaningful, personalized insights, helping users make smarter decisions every day.
The features you'll find with us:

- Intuitive, User-Friendly Interface: We believe that managing your money should be straightforward and stress-free. Our clean, modern design ensures that users of all experience levels can navigate their finances effortlessly.
- AI-Powered Insights: Leveraging the latest advancements in artificial intelligence, our platform analyzes your spending and provides personalized recommendations to optimize your budget and achieve your savings goals. The AI adapts to your unique habits, providing tailored advice that evolves with your lifestyle.
- Alerts and Reminders: Create a budget and receive notifications when it is exceeded.
  Summary:
  We’re passionate about making money management accessible, insightful, and even enjoyable. Whether you’re looking to build better habits, save for something special, or simply gain peace of mind, our portal is here to help, every step of the way

🎥 TITLE:
"Where Did My Money Go?" – An Explainer for [Your SaaS Name]

[Scene 1: Cold Open – The Problem (0:00–0:12)]
Visual:
Minimal 2D character (Alex), looking at their phone while a pizza delivery arrives. Ping! Ping! Notifications: “$12.99 Subscription Renewed”, “$84.50 Clothing Purchase”, “$8.99 Coffee App”.

Voiceover:

"Ever wonder where all your money goes… but the answer just isn’t there?"

[Scene 2: Chaos Montage (0:13–0:25)]
Visual:
Alex walking through a blur of scenes: grocery checkout, streaming binge, impulse buys, online shopping cart, swiping tap-to-pay. Then checking the bank app — shocked face.

Voiceover:

"You’re not alone. Most people lose track. Small charges add up, bills sneak in, and budgets? Pfft—what budgets?"

[Scene 3: Enter the Solution (0:26–0:36)]
Visual:
Everything pauses. Screen zooms out. Interface of your SaaS appears in clean UI, like Slack meets Notion. Friendly colors. Labels: “Track”, “Plan”, “Visualize”, “Save”.

Voiceover:

"That’s why we built [Your App Name]. One smart place to see where your money goes, make a plan, and actually stick to it."

[Scene 4: Features Overview (0:37–0:56)]
Visual:
Quick, stylish transitions between features:

A pie chart grows showing spending categories.

Budget bar fills up with green: “Groceries - On Track”.

Monthly AI report drops in, with graphs, tips: “Overspent on takeout 🍕. Try a meal plan?”

A character reacts with “Whoa!” as they see a visualized breakdown.

Voiceover:

"Visualize your spending. Create budgets that work for real life. And every month, get an AI-generated report that shows exactly how you're doing — and how to do better."

[Scene 5: Payoff & Emotion (0:57–1:05)]
Visual:
Alex now relaxed, sipping coffee at home, progress bar shows “60% toward Vacation Fund”. They smile. Thought bubble: "I got this."

Voiceover:

"Finally, understand your money. No spreadsheets. No stress. Just smarter finances—automatically."

[Scene 6: Call to Action (1:06–1:15)]
Visual:
Clean logo screen. App on phone and desktop. CTA: Start Free Today + App Store / Google Play / Web.

Voiceover:

"Try [Your App Name] free today. And never ask ‘Where did my money go?’ again."

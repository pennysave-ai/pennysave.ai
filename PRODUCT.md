# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

The product people use is the PennySave iPhone app, which lives outside this repository. This repository's design surface is the marketing site (landing page, privacy policy, terms of service). The `(protected)` dashboard routes are not a live product surface. The repo also runs scheduled jobs (exchange rates, monthly AI reports, report delivery) and API routes the app calls.

## Users

People in the US and the EU who need help with their personal finances: their money "just goes", they feel behind or guilty about it, and spreadsheet-style budgeting apps didn't stick for them. They use PennySave alone, or share an account with a partner or flatmates.

## Product Purpose

PennySave makes tracking money effortless enough that people keep doing it: a payment takes three taps, and the whole month (what came in, what went out, where it went) is one glance away. Success means the visitor installs the iPhone app from the App Store and starts with the free plan or the 30-day Premium trial.

## Positioning

Budgeting without the homework, and without the guilt. The core claim is low effort: three-tap entry, receipt recognition, and an AI-written monthly report in plain language. Money should feel like progress, not punishment.

## Operating Context

- Visitors reach the site from search, social media (Instagram and TikTok, both `@pennysave.ai`) and links. Every main call to action goes to the App Store listing (`apps.apple.com/app/id6754218614`).
- The site's language is picked automatically from the browser and can be changed by hand: English, German, French, Spanish.
- Visitors can send feature requests through the site's form, with an optional email for a reply. Support address: support@pennysave.ai.

## Capabilities and Constraints

- **Free, forever, no card needed:** unlimited transactions, accounts and categories, and a monthly dashboard (spent, in, out, net).
- **Premium (30-day free trial, started inside the app, billed through the App Store, cancel any time):** everything in Free plus receipt recognition, shared accounts, and AI monthly reports.
- **Currencies mentioned:** euro, pound, dollar, HK dollar. **App languages:** English, German, French, Spanish.
- **Roadmap (shown as "Coming soon", not shipped):** budgets and alerts, a Siri assistant, bank card linking through Apple FinanceKit (Premium, US only).
- iPhone only; there is no Android app and no usable web app.
- Translated legal pages are not legally reviewed; the English version is the binding one.
- **Undecided:** Premium price (the site doesn't show one).

## Brand Commitments

- Name: PennySave, written "PennySave.ai" as the wordmark. Logo: `src/app/public/pennysave_logo.png`.
- Voice, taken from the shipped copy: warm, plain, reassuring and never shaming ("You're not bad with money. You just had the wrong tools."). Speak to the visitor as "you", short sentences, no finance jargon.

## Evidence on Hand

- No App Store ratings, reviews, testimonials, user counts, press or awards yet. Future work must not invent any of these, or any customer quote or statistic.
- The landing page uses illustrative in-app content (sample transactions, an example AI report line). It must stay clearly an example of the product, never presented as real user data.

## Product Principles

1. **Effort is the enemy.** Every claim and flow should show how little work PennySave asks for.
2. **Calm over alarm.** Reassure people about money; never use fear, shame or urgency tricks.
3. **Honest by default.** Only claim shipped features, label roadmap items as coming, and show no proof that doesn't exist.
4. **Free is real.** The free plan is a complete product, not a bait. Premium is an upgrade "when it clicks".
5. **Local everywhere.** Every visitor-facing string ships in all four languages, and layouts must hold up when German or French text runs longer.

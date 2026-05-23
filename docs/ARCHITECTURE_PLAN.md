# Trading Journal App — Architecture Plan

# Technical Stack

## Frontend
- Next.js App Router
- React
- Tailwind CSS

## Backend
- Next.js Server Actions

## Database
- Supabase PostgreSQL

## ORM
- Prisma

## Authentication
- Supabase Auth

## Storage
- Supabase Storage

## Validation
- Zod

## Forms
- React Hook Form

---

# High-Level Architecture

Frontend (Next.js App Router)
↓
Server Actions
↓
Prisma ORM
↓
Supabase PostgreSQL

Additional Services:
- Supabase Auth
- Supabase Storage

---

# Project Structure

src/
│
├── app/
│   ├── dashboard/
│   ├── trades/
│   │   ├── new/
│   │   ├── [id]/
│   │   └── page.tsx
│   │
│   ├── reports/
│   │   ├── weekly/
│   │   └── monthly/
│   │
│   ├── auth/
│   │   ├── login/
│   │   └── signup/
│   │
│   └── layout.tsx
│
├── components/
│   ├── forms/
│   ├── trades/
│   ├── checklist/
│   ├── reports/
│   ├── ui/
│   └── layout/
│
├── lib/
│   ├── prisma.ts
│   ├── supabase.ts
│   ├── auth.ts
│   └── validations/
│
├── prisma/
│   └── schema.prisma
│
├── types/
│
└── styles/

---

# Main Application Pages

# Dashboard

Route:
/dashboard

Purpose:
- Display trading overview
- Weekly performance
- Recent trades
- Setup quality metrics

---

# New Trade Page

Route:
/trades/new

Purpose:
Main trade journaling workflow.

Contains:
- strategy checklist
- trade details
- psychology section
- screenshot upload

This is the most important page in the application.

---

# Trade History Page

Route:
/trades

Purpose:
- View all trades
- Filter trades
- Search trades
- Review historical setups

---

# Trade Detail Page

Route:
/trades/[id]

Purpose:
Detailed review of a single trade.

Contains:
- screenshots
- setup checklist
- notes
- emotional review
- RR analysis

---

# Weekly Report Page

Route:
/reports/weekly

Purpose:
Weekly performance analysis.

---

# Monthly Report Page

Route:
/reports/monthly

Purpose:
Monthly behavioral and strategy analysis.

---

# Database Architecture

# Main Tables

## trades

Stores all trade information.

### Fields
- id
- user_id
- pair
- direction
- entry_price
- exit_price
- stop_loss
- take_profit
- risk_reward
- position_size
- entry_time
- exit_time
- entry_timeframe
- higher_timeframe
- profit_loss
- strategy_notes
- mistake_notes
- mental_state
- followed_plan
- created_at

---

## trade_checklists

Stores setup confirmations.

### Fields
- id
- trade_id
- support
- resistance
- trendline
- order_block
- retest
- rejection_candle
- liquidity_sweep
- htf_alignment
- score

---

## trade_images

Stores uploaded screenshots.

### Fields
- id
- trade_id
- image_url
- image_type
- created_at

### Image Types
- before_entry
- after_exit
- higher_timeframe

---

# Prisma Relationships

Trade
├── Checklist
└── Screenshots[]

One trade:
- has one checklist
- can have many screenshots

---

# Authentication Architecture

Use:
- Supabase Auth

Authentication methods:
- Email/password

Users must:
- login
- signup
- access only their own trades

---

# Screenshot Upload Architecture

Use:
- Supabase Storage

Bucket:
trade-screenshots

Flow:

User uploads screenshot
↓
Supabase Storage
↓
Get public URL
↓
Save URL in database

---

# State Management

Do NOT use Redux.

Use:
- React state
- Server Actions
- URL params

This is enough for MVP.

---

# Form Architecture

The New Trade form should be divided into sections.

# Section 1 — Strategy Checklist

Examples:
- Support respected
- Resistance respected
- Order block respected
- Retest confirmed

---

# Section 2 — Trade Information

Examples:
- Pair
- Entry
- SL
- TP
- RR
- Entry time
- Exit time

---

# Section 3 — Psychology

Examples:
- Mood
- Confidence
- Did I follow my rules?
- Mistakes made

---

# Section 4 — Screenshot Uploads

Examples:
- Before entry screenshot
- After exit screenshot
- HTF screenshot

---

# Validation

Use:
- Zod

Validation should handle:
- form safety
- required fields
- proper data types
- cleaner error handling

---

# Styling Guidelines

Use:
- Tailwind CSS

UI should be:
- minimal
- clean
- dark mode first
- dashboard-focused
- trader-friendly

---

# Recommended UI Structure

Sidebar Layout:

- Dashboard
- New Trade
- Trades
- Reports
- Settings

Main dashboard:
- stats cards
- recent trades
- weekly overview
- checklist quality

---

# Recommended Development Order

# Step 1
Create Next.js app

# Step 2
Install dependencies

# Step 3
Setup Supabase

# Step 4
Setup Prisma

# Step 5
Create database schema

# Step 6
Build authentication

# Step 7
Build New Trade page

# Step 8
Save trades to database

# Step 9
Upload screenshots

# Step 10
Build trade history

# Step 11
Build reports

---

# Final MVP Scope

The first release should ONLY include:

- Login/signup
- Add trade
- Strategy checklist
- Screenshot upload
- Trade history
- Trade details
- Weekly report
- Monthly report

Nothing more.

---

# Core Product Identity

This app is NOT:
- a broker
- a charting platform
- an exchange

This app IS:
- a discipline system
- a trader performance journal
- a review and accountability platform
- a consistency tracker

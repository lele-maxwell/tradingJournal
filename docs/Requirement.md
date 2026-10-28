# Requirements Document

## 1. Application Overview

**Application Name:** Edge Journal (Alternative names: Discipline Journal, Precision Trader)

**Description:** A modern trading journal application designed to help traders improve discipline, strategy execution, psychology, and consistency. The app focuses on strategy validation before entering trades, structured trade journaling, psychological tracking, screenshot-based reviews, and weekly/monthly performance analysis.

**Target Users:** Beginner to intermediate traders

**Core Value:** Help traders determine whether they are consistently following their trading strategy and identify patterns in performance, discipline, and psychology. The app encourages discipline, patience, consistency, self-review, and emotional awareness.

**What It Is NOT:** Not a broker, exchange, charting platform, or automated trading system. It IS a personal trading performance and discipline journal.

## 2. Users and Usage Scenarios

**Target Users:**
- Beginner traders learning to follow a trading strategy
- Intermediate traders seeking to improve consistency and discipline
- Traders who want to track psychological patterns affecting performance

**Core Usage Scenarios:**
- Trader finds a potential setup and validates it against strategy checklist before entry
- Trader records trade details, risk management parameters, and execution notes
- Trader tracks emotional state and discipline adherence for each trade
- Trader uploads screenshots for visual review and pattern recognition
- Trader reviews weekly and monthly performance to identify strengths and weaknesses

## 3. Page Structure and Functionality

### Page Hierarchy

```
Edge Journal
├── Authentication
│   ├── Login Page
│   └── Signup Page
├── Dashboard
├── New Trade Page
├── Trade History Page
├── Trade Detail Page
├── Weekly Report Page
└── Monthly Report Page
```

### 3.1 Authentication

#### 3.1.1 Login Page
- User enters email and password to log in
- Access to trading journal after successful authentication

#### 3.1.2 Signup Page
- User enters email and password to create account
- Account creation enables access to all journal features

### 3.2 Dashboard

**Purpose:** Provide overview of trading performance and recent activity

**Functionality:**
- Display overview statistics: total trades, win rate, total P/L, average RR
- Show recent trades list with basic information
- Display weekly performance summary
- Show checklist quality metrics (average checklist score)

### 3.3 New Trade Page

**Purpose:** Record new trade with strategy validation, trade details, psychology tracking, and screenshots

**Functionality:**

**A. Strategy Checklist Section**
- Display checklist items organized by categories:
  - Market Structure: Support respected, Resistance respected, Trendline respected, Order block respected, Intersection/confluence present, Retest confirmed, Rejection candle formed, Liquidity sweep occurred, Market structure shift confirmed, Higher timeframe aligned
  - Session Conditions: London session, New York session, Avoided low-volume hours
  - Execution Conditions: Entry confirmation respected, Risk management respected, No impulsive entry
- User selects applicable conditions via checkboxes/toggles
- Auto-calculate and display Checklist Score (e.g., \"8/10 confirmations met\")

**B. Trade Journal Section**
- User enters trade information:
  - General: Asset/Pair, Buy or Sell, Strategy name
  - Entry & Exit: Entry price, Exit price, Stop Loss (SL), Take Profit (TP)
  - Risk Management: Position size, Risk %, Risk-to-Reward ratio (RR)
  - Timing: Entry time, Exit time, Trade duration, Entry timeframe, Higher timeframe analysis
  - Notes: Setup explanation, Execution notes, Lessons learned, Mistakes made

**C. Psychology & Mental State Section**
- User selects Emotional State: Calm, Focused, Tired, Fearful, Overconfident, Revenge trading, Emotional, Distracted
- User completes Self-Assessment checkboxes:
  - Did I follow my plan?
  - Did I move SL emotionally?
  - Did I enter too early?
  - Did I overtrade today?
  - Was my mental health okay before entry?

**D. Screenshot & Analysis Section**
- User uploads multiple screenshots per trade
- User specifies screenshot type for each upload: Before Entry, After Exit, Higher Timeframe Analysis
- Screenshots stored for visual review and pattern recognition

**E. Save Trade**
- User saves completed trade entry
- Trade data stored in backend database
- Screenshots stored in backend storage

### 3.4 Trade History Page

**Purpose:** Display list of all saved trades with filtering and searching capabilities

**Functionality:**
- Display all trades in list format with key information: date, asset, strategy, outcome, P/L, checklist score
- User can filter trades by: date range, asset, strategy, outcome (win/loss), emotional state
- User can search trades by asset name or strategy name
- User can select trade to view detailed information

### 3.5 Trade Detail Page

**Purpose:** Display comprehensive breakdown of individual trade

**Functionality:**
- Display all trade information: general details, entry/exit data, risk management, timing, notes
- Display strategy checklist with score
- Display psychology and mental state information
- Display all uploaded screenshots organized by type
- User can edit trade information

### 3.6 Weekly Report Page

**Purpose:** Provide performance summary for current week

**Functionality:**
- Display weekly metrics:
  - Total trades
  - Wins and Losses
  - Win rate
  - Total P/L
  - Average RR
  - Best setup type
  - Most common mistake
  - Mental state overview
- Calculate metrics based on trades within current week date range

### 3.7 Monthly Report Page

**Purpose:** Provide performance summary for current month

**Functionality:**
- Display monthly metrics:
  - Total profit/loss
  - Average trade duration
  - Most profitable setup
  - Most emotional trading day
  - Checklist consistency
  - Strategy performance
- Calculate metrics based on trades within current month date range

## 4. Business Rules and Logic

### 4.1 Checklist Score Calculation
- Count total number of checklist items
- Count number of items marked as met by user
- Calculate score as: (Items Met / Total Items)
- Display score in format: \"X/Y confirmations met\"

### 4.2 Trade Duration Calculation
- Calculate duration as: Exit time - Entry time
- Display duration in appropriate unit (minutes, hours, days)

### 4.3 Risk-to-Reward Ratio Calculation
- Calculate RR as: (Take Profit - Entry Price) / (Entry Price - Stop Loss) for Buy trades
- Calculate RR as: (Entry Price - Take Profit) / (Stop Loss - Entry Price) for Sell trades

### 4.4 Win Rate Calculation
- Calculate as: (Number of Winning Trades / Total Trades) × 100%

### 4.5 Report Date Range
- Weekly Report: Calculate from Monday 00:00:00 to Sunday 23:59:59 of current week
- Monthly Report: Calculate from 1st day 00:00:00 to last day 23:59:59 of current month

### 4.6 Data Storage
- Trade data stored in backend database
- Screenshots stored in backend storage with reference to trade record
- User can only access their own trade data

## 5. Exceptions and Edge Cases

| Scenario | Handling |
|----------|----------|
| User submits trade without completing all required fields | Display validation error, highlight missing fields |
| User uploads screenshot in unsupported format | Display error message, specify supported formats |
| User attempts to view report with no trades in period | Display message indicating no data available for selected period |
| User edits trade after initial save | Update trade record in database, preserve original creation timestamp |
| User attempts to access another user's trade data | Deny access, display error message |
| Screenshot upload fails | Display error message, allow user to retry upload |
| User enters invalid price values (negative, non-numeric) | Display validation error, prevent submission |
| User calculates RR with zero stop loss distance | Display error message, require valid stop loss |

## 6. Acceptance Criteria

1. User completes signup and logs in successfully
2. User navigates to New Trade Page and completes strategy checklist
3. User enters all trade information including entry price, exit price, stop loss, take profit, and risk management parameters
4. User selects emotional state and completes self-assessment checkboxes
5. User uploads at least one screenshot
6. User saves trade and views it in Trade History
7. User opens Weekly Report Page and views performance summary for current week
8. User opens Monthly Report Page and views performance summary for current month

## 7. Out of Scope for This Release

- Automated trade import from brokers or exchanges
- Real-time price data integration
- Charting or technical analysis tools within the app
- Social features (sharing trades, following other traders, community discussions)
- Mobile native applications (iOS, Android)
- Trade alerts or notifications
- Backtesting functionality
- Integration with third-party trading platforms
- Multi-currency support beyond basic asset pair entry
- Advanced analytics (machine learning, predictive modeling)
- Export functionality (PDF reports, CSV exports)
- Custom checklist creation or modification
- Trade tagging or categorization beyond strategy name
- Calendar view of trades
- Goal setting and tracking features
- Journaling templates or pre-defined strategies
- Video upload support
- Trade comparison tools
- Performance benchmarking against market indices
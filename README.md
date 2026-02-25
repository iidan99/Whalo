# Fish of Fortune - E2E Tests

Automated tests for the Fish of Fortune wheel spin API. Built with Playwright + TypeScript.

## What's This?

I built an automated test suite for the Fish of Fortune game's backend API. The main focus is testing the wheel spin feature and making sure player state (coins, energy, rewards) persists correctly across sessions.

## Setup

```bash
npm install
npx playwright install
```

## Running Tests

```bash
# All tests
npx playwright test

# Specific tests
npx playwright test happyflow
npx playwright test spin-without-energy
npx playwright test wheel-scripted-check

# With UI (helpful for debugging)
npx playwright test --ui

# See the browser
npx playwright test --headed
```

## Project Structure

```
tests/
├── api/
│   ├── clients/
│   │   ├── authClient.ts       # Login/auth logic
│   │   └── wheelClient.ts      # Wheel spin logic
│   └── requests/
│       └── requestApi.ts       # Base HTTP wrapper
├── config/
│   └── config.ts               # API URLs and endpoints
├── helpers/
│   └── userSession.ts          # Type definitions
├── happyflow.spec.ts           # Main happy path tests
├── spin-without-energy.spec.ts # What happens with no energy
└── wheel-scripted-check.spec.ts    # Check if wheel is scripted or random
```

## What I'm Testing

### Main Flow (`happyflow.spec.ts`)

The basic user journey:

1. Create a new account (auto-generates unique deviceId)
2. Spin the wheel once
3. Check that rewards are added to balance
4. Re-login and verify everything persisted

What I validate:

- AccessToken works and changes on re-login
- Coins/energy update correctly after spin
- State doesn't get lost between sessions
- No duplicate rewards on re-login
- AccountCreated flag is true for new users, false for existing

### No Energy Tests (`spin-without-energy.spec.ts`)

Testing what happens when you run out of energy:

1. Login
2. Spin until energy hits 0
3. Try to spin again - should get "NotEnoughResources" error

Also tracks how many spins happened (found the regeneration bug while doing this).

### Wheel Scripted Check (`wheel-scripted-check.spec.ts`)

Tests whether the wheel is scripted (same rewards for all users) or random:

1. Create two different users and spin until energy depletes for each.
2. Compare reward sequences (RewardDefinitionType, RewardResourceType, Amount).
3. Log result: `X/Y spins identical → scripted | random`.
4. **Assertion:** By default `EXPECT_RANDOM_WHEEL = true` — the test **fails** if all spins are identical (wheel is scripted when we expect random). Set to `false` to expect a scripted wheel instead.

## How the API Works

A few things I learned:

- The API returns HTTP 200 for everything, even errors
- Actual status is in the JSON: `status: 0` = success, other values = error
- Errors look like: `{ "status": -1, "response": "NotEnoughResources" }`
- Each spin costs 1 energy
- Coin rewards have `RewardDefinitionType=1` AND `RewardResourceType=1`
- Energy refill reward uses `RewardResourceType=3` (e.g. `Amount: 10`)

## Expected Behavior: Energy Refill

After verification with the product/backend, the following is **intended behavior** (not a bug):

- New user starts with 10 energy.
- After 10 spins, energy would reach 0, but the API returns a **reward that refills energy** (e.g. `RewardDefinitionType: 1`, `RewardResourceType: 3`, `Amount: 10`).
- So a new user can spin **20 times** in total before getting "NotEnoughResources".

The test `spin-without-energy.spec.ts` spins until energy is depleted (20 spins for a new user) and then asserts "NotEnoughResources" on the next spin.

## Things I Assumed

1. Each unique deviceId creates a new account
2. LoginSource should be formatted as `test_{something}`
3. Coins are rewards with `RewardDefinitionType=1` AND `RewardResourceType=1`
4. Each spin should cost exactly 1 energy
5. New accounts start with 10 energy and get one energy refill after 10 spins (20 spins total before NotEnoughResources)
6. AccessToken changes on re-login for security reasons
7. API returns HTTP 200 even for errors (error details are in the JSON body)

## Limitations & Notes

- Every test creates a new random user (can't reuse specific test accounts)
- Test accounts aren't cleaned up after tests run
- Energy refill after 10 spins affects spin-count expectations
- All tests hit the real API (no mocking)

## Notes

Built this using:

- Playwright for API testing
- TypeScript for type safety
- Organized with client classes for cleaner code

Each client (`AuthClient`, `WheelClient`) wraps API calls so tests stay clean and readable.

## Assignment Completion

This project fulfills all requirements:

- ✅ E2E automated tests for wheel spin flow
- ✅ Login → Spin → Re-login flow
- ✅ State persistence validation
- ✅ Reward application validation
- ✅ No duplicate rewards check
- ✅ No rollback validation
- ✅ Extra validations (AccountCreated, Energy, Gems)
- ✅ Spin till out of energy tests
- ✅ Spin till out of energy + energy refill behavior documented
- ✅ README with assumptions and findings
# Whalo

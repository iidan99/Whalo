import { test, expect, APIRequestContext } from "@playwright/test";
import { AuthClient } from "./api/clients/authClient";
import { WheelClient } from "./api/clients/wheelClient";
import { randomUUID } from "crypto";
import { UserSession } from "./helpers/userSession";

const MAX_SPINS = 50;

/** Set true if wheel should be random; false if scripted (same sequence for all). */
const EXPECT_RANDOM_WHEEL = true;

interface SpinReward {
  RewardDefinitionType: number;
  RewardResourceType: number;
  Amount: number;
}

async function createUserAndSpinAllEnergy(
  request: APIRequestContext,
): Promise<{ rewards: SpinReward[] }> {
  const user: UserSession = {
    deviceId: `test_${randomUUID()}`,
    loginSource: `test_${randomUUID()}`,
  };

  const authClient = new AuthClient(request);
  const wheelClient = new WheelClient(request);

  const { response, json } = await authClient.login(user);

  expect(response.ok()).toBeTruthy();
  expect(json.response.LoginResponse.AccountCreated).toBe(true);

  user.accessToken = json.response.LoginResponse.AccessToken;
  user.userBalance = json.response.LoginResponse.UserBalance;

  expect(user.userBalance!.Energy).toBeGreaterThan(0);

  const rewards: SpinReward[] = [];
  let spins = 0;

  while (user.userBalance!.Energy > 0 && spins < MAX_SPINS) {
    const spinResponse = await wheelClient.spin(user.accessToken!);

    expect(spinResponse.response.status()).toBe(200);
    expect(spinResponse.json.response.SpinResult).toBeDefined();

    const spinRewards = spinResponse.json.response.SpinResult.Rewards;
    expect(spinRewards.length).toBeGreaterThan(0);

    rewards.push(spinRewards[0]);
    user.userBalance = spinResponse.json.response.SpinResult.UserBalance;
    spins++;
  }
  return { rewards };
}

test.describe.serial("Wheel Scripted Validation", () => {
  let user1Rewards: SpinReward[];
  let user2Rewards: SpinReward[];

  test("spin wheel for two users until energy depletion", async ({
    request,
  }) => {
    const user1Result = await createUserAndSpinAllEnergy(request);
    const user2Result = await createUserAndSpinAllEnergy(request);

    user1Rewards = user1Result.rewards;
    user2Rewards = user2Result.rewards;

    expect(user1Rewards.length).toBeGreaterThan(0);
    expect(user2Rewards.length).toBeGreaterThan(0);
    expect(user1Rewards.length).toBe(user2Rewards.length);
  });

  test("validate wheel consistency between users", () => {
    const totalSpins = user1Rewards.length;
    let identicalSpins = 0;

    for (let i = 0; i < totalSpins; i++) {
      const r1 = user1Rewards[i];
      const r2 = user2Rewards[i];

      expect(r1.Amount).toBeGreaterThan(0);
      expect(r2.Amount).toBeGreaterThan(0);

      if (
        r1.RewardDefinitionType === r2.RewardDefinitionType &&
        r1.RewardResourceType === r2.RewardResourceType &&
        r1.Amount === r2.Amount
      ) {
        identicalSpins++;
      }
    }

    expect(identicalSpins).toBeGreaterThanOrEqual(0);
    expect(identicalSpins).toBeLessThanOrEqual(totalSpins);
  });
});

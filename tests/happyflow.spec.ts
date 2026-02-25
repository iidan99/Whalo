import { test, expect } from "@playwright/test";
import { randomUUID } from "crypto";
import { AuthClient } from "./api/clients/authClient";
import { WheelClient } from "./api/clients/wheelClient";
import { UserSession } from "./helpers/userSession";

let user: UserSession;

test.describe.serial("HappyFlow", () => {
  test.beforeAll(async () => {
    user = {
      deviceId: `test_${randomUUID()}`,
      loginSource: `test_${randomUUID()}`,
    };
  });

  test("should create new account and login successfully", async ({
    request,
  }) => {
    const authClient = new AuthClient(request);
    const { response, json } = await authClient.login(user);

    user.accessToken = json.response.LoginResponse.AccessToken;
    user.userBalance = json.response.LoginResponse.UserBalance;
    
    expect(response.ok()).toBeTruthy();
    expect(json.response.LoginResponse.AccountCreated).toBe(true);
    expect(json.response.LoginResponse.AccessToken).toBeTruthy();
  });

  test("should spin wheel and receive rewards", async ({ request }) => {
    const wheelClient = new WheelClient(request);
    const { response, json } = await wheelClient.spin(user.accessToken!);

    const spinResult = json.response.SpinResult;
    expect(user.userBalance).toBeDefined();
    const coinsBefore = user.userBalance!.Coins;
    const coinsAfter = spinResult.UserBalance.Coins;
    const rewards = spinResult.Rewards;
    
    expect(response.ok()).toBe(true);

    const coinReward = rewards.find(
      (r) => r.RewardDefinitionType === 1 && r.RewardResourceType === 1,
    );
    const coinsEarned = coinReward?.Amount || 0;

    expect(spinResult.UserBalance.Energy).toBe(user.userBalance!.Energy - 1);
    expect(spinResult.UserBalance.Gems).toBe(user.userBalance!.Gems);
    user.userBalance = spinResult.UserBalance;

    if (coinsEarned > 0) {
      expect(coinsAfter).toBe(coinsBefore + coinsEarned);
    }
  });

  test("should persist balance after re-login", async ({ request }) => {
    const authClient = new AuthClient(request);
    const { response, json } = await authClient.login(user);
    const reLoginData = json.response.LoginResponse;
    expect(response.ok()).toBe(true);
    expect(reLoginData.AccountCreated).toBe(false);
    expect(reLoginData.AccessToken).toBeTruthy();
    expect(reLoginData.AccessToken).not.toBe(user.accessToken);
    expect(reLoginData.UserBalance).toBeDefined();
    expect(reLoginData.UserBalance.Energy).toBe(user.userBalance!.Energy);
    expect(reLoginData.UserBalance.Gems).toBe(user.userBalance!.Gems);
    expect(reLoginData.UserBalance.Coins).toBe(user.userBalance!.Coins);
  });
});

import { test, expect } from "@playwright/test";
import { AuthClient } from "./api/clients/authClient";
import { WheelClient } from "./api/clients/wheelClient";
import { randomUUID } from "crypto";
import { UserSession } from "./helpers/userSession";

let user: UserSession;
const MAX_SPINS = 50;

test.describe.serial("Spin Without Energy", () => {
  test.beforeAll(async () => {
    user = {
      deviceId: `test_${randomUUID()}`,
      loginSource: `test_${randomUUID()}`,
    };
  });

  test("create new account and login successfully", async ({ request }) => {
    const authClient = new AuthClient(request);
    const { response, json } = await authClient.login(user);

    user.accessToken = json.response.LoginResponse.AccessToken;
    user.userBalance = json.response.LoginResponse.UserBalance;

    expect(response.ok()).toBeTruthy();
    expect(json.response.LoginResponse.AccountCreated).toBe(true);
    expect(json.response.LoginResponse.AccessToken).toBeTruthy();
    expect(user.userBalance!.Energy).toBeGreaterThan(0);
  });

  test("spin wheel until user has no energy", async ({ request }) => {
    const wheelClient = new WheelClient(request);
    let spinsCount = 0;

    while (user.userBalance!.Energy > 0 && spinsCount < MAX_SPINS) {
      const { response, json } = await wheelClient.spin(user.accessToken!);

      if (response.ok()) {
        user.userBalance = json.response.SpinResult.UserBalance;
        spinsCount++;
      } else {
        break;
      }
    }

    // New user: 10 energy + refill after 10 spins = 20 spins total
    expect(spinsCount).toBe(20);
    expect(user.userBalance!.Energy).toBe(0);
  });

  test("fail when spinning without energy", async ({ request }) => {
    const wheelClient = new WheelClient(request);
    const { response, json } = await wheelClient.spin(user.accessToken!);

    expect(response.ok()).toBe(true);
    expect(json.response).toBe("NotEnoughResources");
  });
});

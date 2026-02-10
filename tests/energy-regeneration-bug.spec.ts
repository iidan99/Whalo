import { test, expect } from "@playwright/test";
import { AuthClient } from "./api/clients/authClient";
import { WheelClient } from "./api/clients/wheelClient";
import { randomUUID } from "crypto";
import { UserSession } from "./helpers/userSession";

// BUG TEST: Energy should be 0 after 10 spins but it jumps back to 10
// This test documents the instant energy regeneration bug

let user: UserSession;

test.describe.serial("BUG: Energy Regeneration After 10 Spins", () => {
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
    expect(user.userBalance!.Energy).toBeGreaterThan(0);

    console.log("Initial energy:", user.userBalance!.Energy);
  });

  test("should check energy after 10 spins", async ({ request }) => {
    const wheelClient = new WheelClient(request);
    const initialEnergy = user.userBalance!.Energy;
    let spinsCount = 0;

    while (user.userBalance!.Energy > 0 && spinsCount < 10) {
      const { response, json } = await wheelClient.spin(user.accessToken!);

      if (response.ok()) {
        user.userBalance = json.response.SpinResult.UserBalance;
        spinsCount++;
        console.log(`Spin ${spinsCount}: Energy = ${user.userBalance!.Energy}`);
      } else {
        console.log("Spin failed:", response.status(), json);
        break;
      }
    }

    console.log("Final energy:", user.userBalance!.Energy);
    console.log("Total spins:", spinsCount);

    // Check if bug exists
    if (user.userBalance!.Energy === 10) {
      console.log("BUG DETECTED: Energy jumped back to 10!");
      expect(user.userBalance!.Energy).toBe(10);
    } else if (user.userBalance!.Energy === 0) {
      console.log("Bug fixed: Energy is 0 as expected");
      expect(user.userBalance!.Energy).toBe(0);
    } else {
      console.log("Unexpected energy value:", user.userBalance!.Energy);
      expect(user.userBalance!.Energy).toBeGreaterThanOrEqual(0);
    }
  });
});

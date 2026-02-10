import { test, expect } from "@playwright/test";
import { AuthClient } from "./api/clients/authClient";
import { WheelClient } from "./api/clients/wheelClient";
import { randomUUID } from "crypto";
import { UserSession } from "./helpers/userSession";

let user: UserSession;
const maxSpins = 50;

test.describe.serial("Spin Without Energy", () => {
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

  test("should spin wheel until user has no energy", async ({ request }) => {
    const wheelClient = new WheelClient(request);
    const initialEnergy = user.userBalance!.Energy;
    let spinsCount = 0;

    while (user.userBalance!.Energy > 0 && spinsCount < maxSpins) {
      const { response, json } = await wheelClient.spin(user.accessToken!);

      if (response.ok()) {
        user.userBalance = json.response.SpinResult.UserBalance;
        spinsCount++;
      } else {
        break;
      }
    }
    console.log("Total spins:", spinsCount);

    if (user.userBalance!.Energy !== 0) {
      console.log(`WARNING: Energy is ${user.userBalance!.Energy}, expected 0`);
    }

    expect(spinsCount).toBeGreaterThanOrEqual(initialEnergy);

    if (spinsCount > initialEnergy) {
      console.log(
        `Energy regenerated during test (${spinsCount - initialEnergy} extra spins)`,
      );
    }
  });

  test("should fail when spinning without energy", async ({ request }) => {
    const wheelClient = new WheelClient(request);
    const { response, json } = await wheelClient.spin(user.accessToken!);

    expect(response.status()).toBe(200);
    expect(json.response).toBe("NotEnoughResources");
  });
});

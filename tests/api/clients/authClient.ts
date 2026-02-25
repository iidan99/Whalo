import { APIRequestContext } from "@playwright/test";
import { randomUUID } from "crypto";
import { UserSession } from "../../helpers/userSession";
import { RequestApi } from "../requests/requestApi";
import { config } from "../../config/config";

export class AuthClient {
  private requestApi: RequestApi;

  constructor(request: APIRequestContext) {
    this.requestApi = new RequestApi(request);
  }

  async login(user?: UserSession) {
    const payload = {
      DeviceId: user?.deviceId ?? `test_test_${randomUUID()}`,
      LoginSource: user?.loginSource ?? `test_${randomUUID()}`,
    };

    return await this.requestApi.post(
      config.endpoints.login,
      {
        "Content-Type": "application/json",
      },
      payload,
    );
  }
}

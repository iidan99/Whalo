import { APIRequestContext } from "@playwright/test";
import { RequestApi } from "../requests/requestApi";
import { config } from "../../config/config";

export class WheelClient {
  private requestApi: RequestApi;

  constructor(request: APIRequestContext) {
    this.requestApi = new RequestApi(request);
  }

  async spin(accessToken: string, multiplier: number = 1) {
    return await this.requestApi.post(
      config.endpoints.wheelSpin,
      {
        "Content-Type": "application/json",
        accessToken,
      },
      { multiplier },
    );
  }
}

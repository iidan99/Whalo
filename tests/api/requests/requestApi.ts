import { APIRequestContext } from "@playwright/test";
import { config } from "../../config/config";

export class RequestApi {
  constructor(private request: APIRequestContext) {}

  async post(
    url: string,
    headers: Record<string, string>,
    payload: Record<string, unknown>,
  ) {
    const response = await this.request.post(`${config.baseUrl}${url}`, {
      headers,
      data: payload,
    });

    const json = await response.json();

    return {
      response,
      json,
      payload,
    };
  }
}

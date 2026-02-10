interface UserBalance {
  readonly Coins: number;
  readonly Gems: number;
  readonly Energy: number;
}
export type UserSession = {
  deviceId: string;
  loginSource: string;
  accessToken?: string;
  userBalance?: UserBalance;
};

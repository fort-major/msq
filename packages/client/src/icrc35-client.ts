import { IICRC1TransferRequest, IMSQPayRequest, IMSQPayResponse, ZMSQPayResponse } from "@fort-major/msq-shared";
import { IICRC35Connection } from "icrc-35";

export const LOGIN_ROUTE = "msq:login";
export const ICRC1_ROUTE = "msq:icrc-1";
export const PAY_ROUTE = "msq:pay";

export class MSQICRC35Client {
  static Origin = process.env.MSQ_SNAP_SITE_ORIGIN;

  constructor(private connection: IICRC35Connection) {}

  async login(): Promise<boolean> {
    const result = await this.connection.request(LOGIN_ROUTE, undefined);

    if (typeof result !== "boolean") {
      throw new Error("Got invalid login response from MSQ, expected type 'boolean'");
    }

    return result;
  }

  async icrc1Transfer(req: IICRC1TransferRequest): Promise<bigint | null> {
    const result = await this.connection.request(ICRC1_ROUTE, req);

    if (result !== null && typeof result !== "bigint") {
      throw new Error("Got invalid icrc1 transfer response from MSQ, expected type 'bigint | null'");
    }

    return result;
  }

  async pay(req: IMSQPayRequest): Promise<IMSQPayResponse> {
    const result: IMSQPayResponse = await this.connection.request(PAY_ROUTE, req);

    return ZMSQPayResponse.parse(result);
  }
}

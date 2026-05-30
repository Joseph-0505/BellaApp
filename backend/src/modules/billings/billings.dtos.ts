import { z } from "zod";
import { BillingResponse } from "../../shared/mappers/billing-response";
import { CashMovementResponse } from "../../shared/mappers/cash-movement-response";
import { billingParamsSchema, payBillingBodySchema } from "./billings.schemas";

export type BillingParamsDto = z.infer<typeof billingParamsSchema>;
export type PayBillingRequestDto = z.infer<typeof payBillingBodySchema>;

export type PayBillingResponseDto = {
  billing: BillingResponse;
  movement: CashMovementResponse;
};

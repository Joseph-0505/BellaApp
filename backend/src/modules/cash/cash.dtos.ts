import { CashResponse } from "../../shared/mappers/cash-response";
import { z } from "zod";
import {
  cashQuerySchema,
  closeCashBodySchema,
  openCashBodySchema,
} from "./cash.schemas";

export type CashQueryDto = z.infer<typeof cashQuerySchema>;
export type OpenCashRequestDto = z.infer<typeof openCashBodySchema>;
export type CloseCashRequestDto = z.infer<typeof closeCashBodySchema>;

export type GetCashResponseDto = CashResponse | null;
export type OpenCashResponseDto = CashResponse;
export type CloseCashResponseDto = CashResponse;

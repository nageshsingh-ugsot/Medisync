import assert from "node:assert/strict";
import test from "node:test";
import { formatINR } from "./format.ts";

test("formats integer paise as rupees without losing paise", () => {
  assert.equal(formatINR(123450), "₹1,234.50");
});

test("formats whole rupees with two decimal places", () => {
  assert.equal(formatINR(3_485_000), "₹34,850.00");
});

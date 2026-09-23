import { describe, expect, it } from "vitest";

import { CreditAccount, InsufficientCreditsError, reserveKey } from "./CreditAccount";

describe("CreditAccount", () => {
  it("reserves what the balance covers, as negative ledger lines keyed per attempt", () => {
    const account = CreditAccount.open("usr_1", 40);

    const entries = account.reserve([
      { assetId: "ast_1", attempt: 1, cost: 10 },
      { assetId: "ast_2", attempt: 1, cost: 10 },
      { assetId: "ast_3", attempt: 1, cost: 10 },
    ]);

    expect(account.balance).toBe(10);
    expect(entries.map((e) => e.amount)).toEqual([-10, -10, -10]);
    expect(entries[0]?.idempotencyKey).toBe(reserveKey("ast_1", 1));
  });

  it("refuses to overdraw and leaves the balance untouched", () => {
    const account = CreditAccount.open("usr_1", 25);

    expect(() =>
      account.reserve([
        { assetId: "ast_1", attempt: 1, cost: 10 },
        { assetId: "ast_2", attempt: 1, cost: 10 },
        { assetId: "ast_3", attempt: 1, cost: 10 },
      ]),
    ).toThrow(InsufficientCreditsError);
    expect(account.balance).toBe(25);
  });

  it("writes no ledger line for free work", () => {
    expect(
      CreditAccount.open("usr_1", 0).reserve([{ assetId: "ast_f", attempt: 1, cost: 0 }]),
    ).toEqual([]);
  });

  it("uses a new key when a failed asset is retried", () => {
    const [first] = CreditAccount.open("usr_1", 40).reserve([
      { assetId: "ast_1", attempt: 1, cost: 10 },
    ]);
    const [retry] = CreditAccount.open("usr_1", 40).reserve([
      { assetId: "ast_1", attempt: 2, cost: 10 },
    ]);

    expect(first?.idempotencyKey).not.toBe(retry?.idempotencyKey);
  });

  it("settles a reservation: release refunds, capture keeps the spend", () => {
    const reservation = { userId: "usr_1", amount: -10, assetId: "ast_1" };

    expect(CreditAccount.settle(reservation, 1, "release").amount).toBe(10);
    expect(CreditAccount.settle(reservation, 1, "capture").amount).toBe(0);
    expect(CreditAccount.settle(reservation, 1, "release").idempotencyKey).toBe(
      CreditAccount.settle(reservation, 1, "capture").idempotencyKey,
    );
  });

  it("only grants positive whole credits", () => {
    expect(CreditAccount.grant("usr_1", 40, "grant:guest:usr_1").amount).toBe(40);
    expect(() => CreditAccount.grant("usr_1", 0, "k")).toThrow();
  });
});

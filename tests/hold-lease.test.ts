import { describe, expect, it } from "vitest";
import { createHoldLease } from "../src/ui/modals/hold-lease";

describe("hold lease", () => {
  it("takes and releases the hold", () => {
    const calls: boolean[] = [];
    const lease = createHoldLease((value) => calls.push(value));

    lease.sync(true);
    lease.sync(false);

    expect(calls).toEqual([true, false]);
  });

  it("does not clear a hold it does not own", () => {
    const calls: boolean[] = [];
    const lease = createHoldLease((value) => calls.push(value));

    lease.sync(false);
    lease.release();

    expect(calls).toEqual([]);
  });

  it("releases only once across repeated close events", () => {
    const calls: boolean[] = [];
    const lease = createHoldLease((value) => calls.push(value));

    lease.sync(true);
    lease.release();
    lease.release();

    expect(calls).toEqual([true, false]);
  });
});

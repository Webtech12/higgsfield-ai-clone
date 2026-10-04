import { describe, expect, it } from "vitest";

import { networkKeyOf } from "./network";

describe("networkKeyOf", () => {
  it("keys an IPv4 address by the whole address", () => {
    expect(networkKeyOf("203.0.113.7")).toBe("v4:203.0.113.7");
    expect(networkKeyOf(" 203.0.113.007 ")).toBe("v4:203.0.113.7");
    expect(networkKeyOf("203.0.113.8")).not.toBe(networkKeyOf("203.0.113.7"));
  });

  it("treats an IPv4-mapped IPv6 address as the IPv4 address", () => {
    expect(networkKeyOf("::ffff:203.0.113.7")).toBe("v4:203.0.113.7");
  });

  it("keys an IPv6 address by its /64, so rotating inside it changes nothing", () => {
    const key = networkKeyOf("2001:db8:abcd:12:1:2:3:4");
    expect(key).toBe("v6:2001:db8:abcd:12");
    expect(networkKeyOf("2001:db8:abcd:12:ffff::1")).toBe(key);
    expect(networkKeyOf("2001:0DB8:ABCD:0012::")).toBe(key);
    expect(networkKeyOf("2001:db8:abcd:13::1")).not.toBe(key);
  });

  it("expands compressed IPv6 addresses before taking the prefix", () => {
    expect(networkKeyOf("2001:db8::1")).toBe("v6:2001:db8:0:0");
    expect(networkKeyOf("::1")).toBe("v6:0:0:0:0");
    expect(networkKeyOf("fe80::1%eth0")).toBe("v6:fe80:0:0:0");
    expect(networkKeyOf("64:ff9b::192.0.2.1")).toBe("v6:64:ff9b:0:0");
  });

  it("puts anything unreadable in one shared bucket", () => {
    for (const value of [null, undefined, "", "not an address", "999.1.1.1", "1:2:3:4:5:6:7:8:9"]) {
      expect(networkKeyOf(value)).toBe("unknown");
    }
    expect(networkKeyOf("1:2:3:4:5:6:7:8::")).toBe("unknown");
  });
});

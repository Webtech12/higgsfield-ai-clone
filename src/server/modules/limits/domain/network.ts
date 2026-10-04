/**
 * Which network a request comes from, for the per-network free trial and allowances (ADR-027): an
 * IPv4 address, or the /64 prefix of an IPv6 address. Homes and phones are given a whole IPv6 /64
 * and may use any address in it, so counting full addresses would let one visitor look like
 * billions. Anything unreadable shares one bucket, so leaving the address out skips nothing.
 */
export function networkKeyOf(address: string | null | undefined): string {
  const value = (address ?? "").trim().toLowerCase().replace(/%.*$/, "");
  const v4 = readIpv4(value.startsWith("::ffff:") ? value.slice("::ffff:".length) : value);
  if (v4) return `v4:${v4}`;
  const v6 = readIpv6(value);
  return v6 ? `v6:${v6.slice(0, 4).join(":")}` : "unknown";
}

/** A dotted IPv4 address without leading zeros, or null. */
function readIpv4(value: string): string | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : Number.NaN));
  return octets.every((octet) => octet <= 255) ? octets.join(".") : null;
}

/** The eight groups of an IPv6 address, lowercase without leading zeros, or null. */
function readIpv6(value: string): string[] | null {
  const halves = value.split("::");
  if (!value.includes(":") || halves.length > 2) return null;
  // An embedded IPv4 tail (64:ff9b::192.0.2.1) fills the last two groups, past the /64 we keep.
  const [head = [], tail = []] = halves.map((half) =>
    half === ""
      ? []
      : half.split(":").flatMap((group) => (group.includes(".") ? ["0", "0"] : [group])),
  );
  const missing = 8 - head.length - tail.length;
  const isCompressed = halves.length === 2;
  if (isCompressed ? missing < 1 : missing !== 0) return null;
  const groups = [...head, ...Array<string>(isCompressed ? missing : 0).fill("0"), ...tail];
  if (!groups.every((group) => /^[0-9a-f]{1,4}$/.test(group))) return null;
  return groups.map((group) => parseInt(group, 16).toString(16));
}

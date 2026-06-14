// ─── Helpers ──────────────────────────────────────────────────────────────────

function getShift(iso: string) {
  return new Date(iso).getHours() < 12 ? "morning" : "noon";
}

export { getShift };

"use client";

import * as React from "react";

// Minimal Switch stub for type-checking while canonical implementation is migrated.
export function Switch(props: React.ComponentProps<'button'>) {
  return <button {...props} /> as any;
}

export default Switch;

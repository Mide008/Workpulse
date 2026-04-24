"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Database } from "@/../packages/types/src/database.types";

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];

export default function TestPage() {
  const [data, setData] = useState<Workspace[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTest() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .returns<Workspace[]>();

      if (error) {
        setError(error.message);
      } else {
        setData(data);
      }
    }

    fetchTest();
  }, []);

  return (
    <div style={{ padding: "2rem", color: "white", background: "#060809" }}>
      <h1>Database Type Test</h1>
      <h2>Workspaces</h2>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : !error ? (
        <p>Loading...</p>
      ) : null}
    </div>
  );
}
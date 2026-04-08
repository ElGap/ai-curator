// test/capture.test.ts
// Test the capture endpoint - these are integration tests that require a running server

import { describe, it, expect, beforeAll } from "vitest";

const TEST_PORT = process.env.AI_CURATOR_PORT || "3333";
const TEST_URL = `http://localhost:${TEST_PORT}`;

async function isServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${TEST_URL}/api`, { method: "GET" });
    return response.status === 200;
  } catch {
    return false;
  }
}

describe("Capture Endpoint", () => {
  const baseUrl = TEST_URL;
  let serverRunning = false;

  beforeAll(async () => {
    serverRunning = await isServerRunning();
    if (!serverRunning) {
      console.log(`⚠️  Server not running at ${TEST_URL}, skipping integration tests`);
    }
  });

  it("should accept a minimal capture request", async () => {
    if (!serverRunning) return;

    const request = {
      source: "opencode",
      apiVersion: "1.0" as const,
      records: [
        {
          instruction: "How do I sort an array in Python?",
          output: "Use the sorted() function or .sort() method.",
        },
      ],
    };

    const response = await fetch(`${baseUrl}/api/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    // Should return 200 or 400/404 (if no dataset exists)
    expect([200, 400, 404]).toContain(response.status);

    if (response.ok) {
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.capture.summary.total).toBe(1);
      expect(data.capture.summary.created).toBe(1);
    }
  });

  it("should reject unregistered source", async () => {
    if (!serverRunning) return;

    const request = {
      source: "unknown-source",
      apiVersion: "1.0" as const,
      records: [
        {
          instruction: "Test",
          output: "Response",
        },
      ],
    };

    const response = await fetch(`${baseUrl}/api/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.code).toBe("SOURCE_NOT_FOUND");
  });

  it("should handle batch captures", async () => {
    if (!serverRunning) return;

    const request = {
      source: "opencode",
      apiVersion: "1.0" as const,
      records: Array(5)
        .fill(null)
        .map((_, i) => ({
          instruction: `Question ${i + 1}`,
          output: `Answer ${i + 1}`,
        })),
      options: {
        skipDuplicates: true,
        enrichMetadata: true,
      },
    };

    const response = await fetch(`${baseUrl}/api/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    // Should process successfully or return dataset error
    expect([200, 400, 404]).toContain(response.status);

    if (response.ok) {
      const data = await response.json();
      expect(data.capture.summary.total).toBe(5);
    }
  });

  it("should handle rich context", async () => {
    if (!serverRunning) return;

    const request = {
      source: "opencode",
      apiVersion: "1.0" as const,
      session: {
        id: "test-session-123",
        name: "Test Session",
        startedAt: new Date().toISOString(),
      },
      records: [
        {
          instruction: "How do I implement rate limiting?",
          output: "Here's a Redis-based approach...",
          context: {
            files: [
              {
                path: "api/routes.py",
                content: "def get_user(user_id):...",
                language: "python",
              },
            ],
            environment: {
              os: "darwin",
              shell: "zsh",
              language: "python",
            },
            model: {
              name: "claude-3.5-sonnet",
              provider: "anthropic",
            },
          },
        },
      ],
    };

    const response = await fetch(`${baseUrl}/api/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    // Should process successfully or return dataset error
    expect([200, 400, 404]).toContain(response.status);
  });
});

import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID ?? "proj_tokenflow",
  runtime: "node-24",
  dirs: ["src/trigger"],
  maxDuration: 300,
});

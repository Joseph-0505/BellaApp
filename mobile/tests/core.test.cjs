const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function load(relative, mocks = {}) {
  const source = fs.readFileSync(path.join(__dirname, "../src", relative), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)((name) => {
    if (!(name in mocks)) throw new Error(`Unexpected dependency: ${name}`);
    return mocks[name];
  }, module, module.exports);
  return module.exports;
}

test("date validation rejects impossible dates and invalid times", () => {
  const { parseAppointmentDate } = load("utils/appointment-date.ts");
  for (const [day, time] of [["31/02/2026", "10:00"], ["29/02/2025", "10:00"], ["10/09/2026", "24:00"], ["10/09/2026", "12:60"]]) {
    assert.throws(() => parseAppointmentDate(day, time));
  }
  const date = parseAppointmentDate("29/02/2028", "09:30");
  assert.equal(date.getDate(), 29);
  assert.equal(date.getHours(), 9);
  assert.equal(date.getMinutes(), 30);
});

test("pagination includes later pages and stops on empty pages", async () => {
  const { listAllPages } = load("services/pagination.ts");
  const calls = [];
  const items = await listAllPages(async ({ page }) => {
    calls.push(page);
    return { data: page < 3 ? [page] : [], meta: { total: 9 } };
  });
  assert.deepEqual(items, [1, 2]);
  assert.deepEqual(calls, [1, 2, 3]);
  await assert.rejects(listAllPages(async () => ({ data: [], meta: {} })), /paginação/);
});

test("queued secure-storage writes cannot restore a token after logout", async () => {
  let value = null;
  const storage = load("services/session-storage.ts", {
    "react-native": { Platform: { OS: "android" } },
    "expo-secure-store": {
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
      setItemAsync: async (_key, token) => { await new Promise(resolve => setTimeout(resolve, 5)); value = token; },
      deleteItemAsync: async () => { value = null; },
      getItemAsync: async () => value,
    },
  });
  await Promise.all([storage.persistRefreshToken("old"), storage.persistRefreshToken("new"), storage.persistRefreshToken(null)]);
  assert.equal(await storage.readRefreshToken(), null);
});

test("web does not persist native session tokens", async () => {
  const storage = load("services/session-storage.ts", { "react-native": { Platform: { OS: "web" } }, "expo-secure-store": {} });
  await storage.persistRefreshToken("token");
  assert.equal(await storage.readRefreshToken(), null);
});

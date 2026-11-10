import { execFileSync } from "node:child_process";

const issuePattern = /\bKAN-\d+\b/i;
const branch = process.env.PR_BRANCH || "";
const title = process.env.PR_TITLE || "";
const baseSha = process.env.PR_BASE_SHA || "";
const headSha = process.env.PR_HEAD_SHA || "HEAD";
const failures = [];

if (!issuePattern.test(branch)) {
  failures.push(`branch '${branch}' must contain a Jira key such as KAN-53`);
}

if (!issuePattern.test(title)) {
  failures.push("pull request title must contain a Jira key such as KAN-53");
}

let commitSubjects = [];

try {
  const range = baseSha ? `${baseSha}..${headSha}` : `-1 ${headSha}`;
  commitSubjects = execFileSync("git", ["log", "--format=%s", ...range.split(" ")], {
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((subject) => subject.trim())
    .filter(Boolean);
} catch (error) {
  failures.push(`could not inspect commit messages: ${error.message}`);
}

for (const subject of commitSubjects) {
  if (!issuePattern.test(subject) && !subject.startsWith("Merge ")) {
    failures.push(`commit '${subject}' must contain a Jira key`);
  }
}

if (failures.length > 0) {
  console.error("Jira reference validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Validated ${commitSubjects.length} commit(s), branch and PR title.`);

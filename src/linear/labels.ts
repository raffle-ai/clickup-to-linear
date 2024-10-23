import { IssueLabelConnection } from "@linear/sdk";

import { linearClient } from "./linear-client";
import allLabels from "../../setup/labels.json";

export async function viewLabels() {
  const labels = await linearClient.issueLabels();
  console.log(labels.nodes.length, "labels found");

  const output = labels.nodes.map((label) => ({
    name: label.name,
    id: label.id,
  }));

  process.stdout.write(JSON.stringify(output, null, 2));
}

export async function createLabels() {
  const existingLabels = await linearClient.issueLabels();

  console.log("Check existing labels...");

  const missingLabels = allLabels.filter(
    (label) => !findLabelByName(label.name, existingLabels)
  );
  if (!missingLabels.length) throw new Error("No labels to create!");

  console.log(
    "Creating missing labels...",
    missingLabels.map((label) => label.name).join(", ")
  );

  for (const label of missingLabels) {
    console.log("Creating label", label.name);

    await linearClient.createIssueLabel({
      name: label.name,
    });
  }
  console.log("Labels created!");
}

const findLabelByName = (name: string, labels: IssueLabelConnection) => {
  return labels.nodes.find((label) => label.name === name);
};

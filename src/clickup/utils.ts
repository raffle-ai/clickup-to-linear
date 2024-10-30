/**
 * Parse the list name in ClickUp to extract the sprint number
 */
export function extractSprintNumber(listName: string) {
  if (listName.toLowerCase().startsWith("backlog")) return "backlog";

  const regex =
    /Sprint\s+(\d+)\s+\((\d{1,2}\/\d{1,2}\/\d{2,4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\)/;
  const match = regex.exec(listName);

  if (match) {
    const sprintNumber = match[1];
    return sprintNumber;
  }
}

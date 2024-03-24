import { summarizeEntries } from "./generation";
import { IEntry } from "./db";

describe("summarizeEntries", () => {
  it("should return a summary of the given entries", async () => {
    const entries: IEntry[] = [
      // Add test entries here
    ];

    const summary = await summarizeEntries(entries);

    console.log(summary);
  });
});

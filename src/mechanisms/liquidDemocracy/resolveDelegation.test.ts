import { describe, it, expect } from "vitest";
import { resolveDelegation, aggregateResults } from "./resolveDelegation";
import type { Person, Ballot } from "./types";

describe("resolveDelegation", () => {
  const people: Person[] = [
    { id: "p1", name: "Alice", expertiseTags: ["AI"] },
    { id: "p2", name: "Bob", expertiseTags: ["教育"] },
    { id: "p3", name: "Carol", expertiseTags: [] },
    { id: "p4", name: "Dave", expertiseTags: [] },
  ];

  it("直接投票のみ", () => {
    const ballots = new Map<string, Ballot>([
      ["p1", { personId: "p1", topicId: "t1", mode: "direct", stance: "agree" }],
      ["p2", { personId: "p2", topicId: "t1", mode: "direct", stance: "disagree" }],
      ["p3", { personId: "p3", topicId: "t1", mode: "direct", stance: "neutral" }],
    ]);

    const results = resolveDelegation(people, ballots);

    expect(results.get("p1")?.stance).toBe("agree");
    expect(results.get("p2")?.stance).toBe("disagree");
    expect(results.get("p3")?.stance).toBe("neutral");
    expect(results.get("p4")?.stance).toBe("unresolved"); // 投票未設定
  });

  it("1段委任", () => {
    const ballots = new Map<string, Ballot>([
      ["p1", { personId: "p1", topicId: "t1", mode: "direct", stance: "agree" }],
      ["p2", { personId: "p2", topicId: "t1", mode: "delegate", delegateTo: "p1" }],
    ]);

    const results = resolveDelegation(people, ballots);

    expect(results.get("p1")?.stance).toBe("agree");
    expect(results.get("p2")?.stance).toBe("agree"); // p1に委任
    expect(results.get("p2")?.delegationChain).toEqual(["p2", "p1"]);
  });

  it("多段委任（3人チェーン）", () => {
    const ballots = new Map<string, Ballot>([
      ["p1", { personId: "p1", topicId: "t1", mode: "direct", stance: "disagree" }],
      ["p2", { personId: "p2", topicId: "t1", mode: "delegate", delegateTo: "p1" }],
      ["p3", { personId: "p3", topicId: "t1", mode: "delegate", delegateTo: "p2" }],
    ]);

    const results = resolveDelegation(people, ballots);

    expect(results.get("p3")?.stance).toBe("disagree");
    expect(results.get("p3")?.delegationChain).toEqual(["p3", "p2", "p1"]);
  });

  it("循環委任（2人）", () => {
    const ballots = new Map<string, Ballot>([
      ["p1", { personId: "p1", topicId: "t1", mode: "delegate", delegateTo: "p2" }],
      ["p2", { personId: "p2", topicId: "t1", mode: "delegate", delegateTo: "p1" }],
    ]);

    const results = resolveDelegation(people, ballots);

    expect(results.get("p1")?.stance).toBe("circular");
    expect(results.get("p2")?.stance).toBe("circular");
  });

  it("循環委任（3人）", () => {
    const ballots = new Map<string, Ballot>([
      ["p1", { personId: "p1", topicId: "t1", mode: "delegate", delegateTo: "p2" }],
      ["p2", { personId: "p2", topicId: "t1", mode: "delegate", delegateTo: "p3" }],
      ["p3", { personId: "p3", topicId: "t1", mode: "delegate", delegateTo: "p1" }],
    ]);

    const results = resolveDelegation(people, ballots);

    expect(results.get("p1")?.stance).toBe("circular");
    expect(results.get("p2")?.stance).toBe("circular");
    expect(results.get("p3")?.stance).toBe("circular");
  });

  it("委任先が未設定", () => {
    const ballots = new Map<string, Ballot>([
      ["p1", { personId: "p1", topicId: "t1", mode: "delegate", delegateTo: "p2" }],
      // p2の投票は未設定
    ]);

    const results = resolveDelegation(people, ballots);

    expect(results.get("p1")?.stance).toBe("unresolved");
  });

  it("存在しない人物への委任", () => {
    const ballots = new Map<string, Ballot>([
      ["p1", { personId: "p1", topicId: "t1", mode: "delegate", delegateTo: "nonexistent" }],
    ]);

    const results = resolveDelegation(people, ballots);

    expect(results.get("p1")?.stance).toBe("unresolved");
  });

  it("集計機能", () => {
    const ballots = new Map<string, Ballot>([
      ["p1", { personId: "p1", topicId: "t1", mode: "direct", stance: "agree" }],
      ["p2", { personId: "p2", topicId: "t1", mode: "direct", stance: "agree" }],
      ["p3", { personId: "p3", topicId: "t1", mode: "direct", stance: "disagree" }],
      ["p4", { personId: "p4", topicId: "t1", mode: "direct", stance: "neutral" }],
    ]);

    const results = resolveDelegation(people, ballots);
    const aggregated = aggregateResults(results);

    expect(aggregated.agree).toBe(2);
    expect(aggregated.disagree).toBe(1);
    expect(aggregated.neutral).toBe(1);
    expect(aggregated.circular).toBe(0);
    expect(aggregated.unresolved).toBe(0);
  });
});

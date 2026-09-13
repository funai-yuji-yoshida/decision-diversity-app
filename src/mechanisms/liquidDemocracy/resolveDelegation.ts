import type { Ballot, Person, ResolvedStance, ResolutionResult } from "./types";

/**
 * トピックに対する全員の投票を解決する
 * @param people 全人物
 * @param ballots そのトピックに対する全投票（personId -> Ballot のマップ）
 * @returns 各人物の解決済みスタンス
 */
export function resolveDelegation(
  people: Person[],
  ballots: Map<string, Ballot>
): Map<string, ResolutionResult> {
  const results = new Map<string, ResolutionResult>();

  for (const person of people) {
    const result = resolvePersonStance(person.id, ballots, new Set());
    results.set(person.id, {
      personId: person.id,
      ...result,
    });
  }

  return results;
}

/**
 * 1人の人物のスタンスを解決する（再帰的）
 * @param personId 解決対象の人物ID
 * @param ballots 投票マップ
 * @param visited 訪問済みノード（循環検出用）
 * @returns 解決結果
 */
function resolvePersonStance(
  personId: string,
  ballots: Map<string, Ballot>,
  visited: Set<string>
): Omit<ResolutionResult, "personId"> {
  // 循環検出
  if (visited.has(personId)) {
    return {
      stance: "circular",
      delegationChain: Array.from(visited),
    };
  }

  visited.add(personId);

  const ballot = ballots.get(personId);

  // 投票が未設定
  if (!ballot) {
    return {
      stance: "unresolved",
      delegationChain: [personId],
    };
  }

  // 直接投票の場合
  if (ballot.mode === "direct") {
    if (!ballot.stance) {
      return {
        stance: "unresolved",
        delegationChain: [personId],
      };
    }
    return {
      stance: ballot.stance,
      delegationChain: [personId],
    };
  }

  // 委任の場合
  if (ballot.mode === "delegate") {
    if (!ballot.delegateTo) {
      return {
        stance: "unresolved",
        delegationChain: [personId],
      };
    }

    // 委任先を再帰的に解決
    const delegateResult = resolvePersonStance(
      ballot.delegateTo,
      ballots,
      new Set(visited) // 新しいSetを渡して、各経路で独立した循環検出を行う
    );

    return {
      stance: delegateResult.stance,
      delegationChain: [personId, ...(delegateResult.delegationChain || [])],
    };
  }

  // 想定外
  return {
    stance: "unresolved",
    delegationChain: [personId],
  };
}

/**
 * 解決結果を集計する
 */
export function aggregateResults(results: Map<string, ResolutionResult>) {
  const counts = {
    agree: 0,
    disagree: 0,
    neutral: 0,
    circular: 0,
    unresolved: 0,
  };

  for (const result of results.values()) {
    if (result.stance === "agree" || result.stance === "disagree" || result.stance === "neutral") {
      counts[result.stance]++;
    } else if (result.stance === "circular") {
      counts.circular++;
    } else {
      counts.unresolved++;
    }
  }

  return counts;
}

export type Stance = "agree" | "disagree" | "neutral";

export interface Person {
  id: string;
  name: string;
  expertiseTags: string[];
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
}

export interface Ballot {
  personId: string;
  topicId: string;
  mode: "direct" | "delegate";
  stance?: Stance;
  delegateTo?: string;
}

export type ResolvedStance = Stance | "circular" | "unresolved";

export interface ResolutionResult {
  personId: string;
  stance: ResolvedStance;
  delegationChain?: string[]; // 委任の経路を記録
}

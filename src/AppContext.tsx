import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Person, Topic, Ballot } from './mechanisms/liquidDemocracy/types';

interface AppState {
  people: Person[];
  topics: Topic[];
  ballots: Ballot[];
}

type Action =
  | { type: 'ADD_PERSON'; person: Person }
  | { type: 'UPDATE_PERSON'; person: Person }
  | { type: 'DELETE_PERSON'; personId: string }
  | { type: 'ADD_TOPIC'; topic: Topic }
  | { type: 'UPDATE_TOPIC'; topic: Topic }
  | { type: 'DELETE_TOPIC'; topicId: string }
  | { type: 'SET_BALLOT'; ballot: Ballot };

const initialState: AppState = {
  people: [
    { id: 'p1', name: 'アリス', expertiseTags: ['技術', 'アーキテクチャ'] },
    { id: 'p2', name: 'ボブ', expertiseTags: ['フロントエンド'] },
    { id: 'p3', name: 'キャロル', expertiseTags: ['バックエンド'] },
    { id: 'p4', name: 'デイブ', expertiseTags: ['営業', 'ビジネス'] },
    { id: 'p5', name: 'イブ', expertiseTags: ['デザイン', 'UX'] },
    { id: 'p6', name: 'フランク', expertiseTags: ['マーケティング'] },
  ],
  topics: [
    {
      id: 't1',
      title: '新機能Aの実装',
      description: '技術的な決定：新しいフレームワークを導入するか'
    },
    {
      id: 't2',
      title: '価格改定の提案',
      description: 'ビジネス判断：製品価格を20%値上げするか'
    },
    {
      id: 't3',
      title: 'リモートワーク継続',
      description: '組織運営：完全リモートワークを継続するか'
    },
  ],
  ballots: [
    // 新機能Aの実装（技術的決定）
    { personId: 'p1', topicId: 't1', mode: 'direct', stance: 'agree' },      // アリス：賛成
    { personId: 'p2', topicId: 't1', mode: 'delegate', delegateTo: 'p1' },   // ボブ→アリスに委任
    { personId: 'p3', topicId: 't1', mode: 'delegate', delegateTo: 'p1' },   // キャロル→アリスに委任
    { personId: 'p4', topicId: 't1', mode: 'delegate', delegateTo: 'p1' },   // デイブ→アリスに委任（技術専門家に委任）
    { personId: 'p5', topicId: 't1', mode: 'direct', stance: 'neutral' },    // イブ：中立
    { personId: 'p6', topicId: 't1', mode: 'delegate', delegateTo: 'p4' },   // フランク→デイブ→アリス（多段委任）

    // 価格改定の提案（ビジネス判断）
    { personId: 'p1', topicId: 't2', mode: 'delegate', delegateTo: 'p4' },   // アリス→デイブに委任
    { personId: 'p2', topicId: 't2', mode: 'delegate', delegateTo: 'p4' },   // ボブ→デイブに委任
    { personId: 'p3', topicId: 't2', mode: 'delegate', delegateTo: 'p4' },   // キャロル→デイブに委任
    { personId: 'p4', topicId: 't2', mode: 'direct', stance: 'disagree' },   // デイブ：反対
    { personId: 'p5', topicId: 't2', mode: 'direct', stance: 'neutral' },    // イブ：中立
    { personId: 'p6', topicId: 't2', mode: 'direct', stance: 'disagree' },   // フランク：反対

    // リモートワーク継続（循環委任のデモ）
    { personId: 'p1', topicId: 't3', mode: 'delegate', delegateTo: 'p2' },   // アリス→ボブ
    { personId: 'p2', topicId: 't3', mode: 'delegate', delegateTo: 'p3' },   // ボブ→キャロル
    { personId: 'p3', topicId: 't3', mode: 'delegate', delegateTo: 'p1' },   // キャロル→アリス（循環！）
    { personId: 'p4', topicId: 't3', mode: 'direct', stance: 'agree' },      // デイブ：賛成
    { personId: 'p5', topicId: 't3', mode: 'direct', stance: 'agree' },      // イブ：賛成
    { personId: 'p6', topicId: 't3', mode: 'delegate', delegateTo: 'p5' },   // フランク→イブに委任
  ],
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_PERSON':
      return { ...state, people: [...state.people, action.person] };
    case 'UPDATE_PERSON':
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.person.id ? action.person : p
        ),
      };
    case 'DELETE_PERSON':
      return {
        ...state,
        people: state.people.filter((p) => p.id !== action.personId),
        ballots: state.ballots.filter((b) => b.personId !== action.personId),
      };
    case 'ADD_TOPIC':
      return { ...state, topics: [...state.topics, action.topic] };
    case 'UPDATE_TOPIC':
      return {
        ...state,
        topics: state.topics.map((t) =>
          t.id === action.topic.id ? action.topic : t
        ),
      };
    case 'DELETE_TOPIC':
      return {
        ...state,
        topics: state.topics.filter((t) => t.id !== action.topicId),
        ballots: state.ballots.filter((b) => b.topicId !== action.topicId),
      };
    case 'SET_BALLOT':
      const existingIndex = state.ballots.findIndex(
        (b) => b.personId === action.ballot.personId && b.topicId === action.ballot.topicId
      );
      if (existingIndex >= 0) {
        const newBallots = [...state.ballots];
        newBallots[existingIndex] = action.ballot;
        return { ...state, ballots: newBallots };
      }
      return { ...state, ballots: [...state.ballots, action.ballot] };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../AppContext';
import type { Stance } from './types';

export default function AdminView() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();

  // 人物追加フォーム
  const [personName, setPersonName] = useState('');
  const [personTags, setPersonTags] = useState('');

  // トピック追加フォーム
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDesc, setTopicDesc] = useState('');

  const handleAddPerson = () => {
    if (!personName.trim()) return;
    dispatch({
      type: 'ADD_PERSON',
      person: {
        id: `p${Date.now()}`,
        name: personName,
        expertiseTags: personTags.split(',').map(t => t.trim()).filter(Boolean),
      },
    });
    setPersonName('');
    setPersonTags('');
  };

  const handleAddTopic = () => {
    if (!topicTitle.trim()) return;
    dispatch({
      type: 'ADD_TOPIC',
      topic: {
        id: `t${Date.now()}`,
        title: topicTitle,
        description: topicDesc || undefined,
      },
    });
    setTopicTitle('');
    setTopicDesc('');
  };

  const handleBallotChange = (personId: string, topicId: string, mode: 'direct' | 'delegate', value: string) => {
    if (mode === 'direct') {
      dispatch({
        type: 'SET_BALLOT',
        ballot: { personId, topicId, mode: 'direct', stance: value as Stance },
      });
    } else {
      dispatch({
        type: 'SET_BALLOT',
        ballot: { personId, topicId, mode: 'delegate', delegateTo: value },
      });
    }
  };

  const getBallot = (personId: string, topicId: string) => {
    return state.ballots.find(b => b.personId === personId && b.topicId === topicId);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h2>管理画面</h2>

      {/* 人物管理 */}
      <section style={{ marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '8px' }}>
        <h3>人物管理</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <input
            type="text"
            placeholder="名前"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            style={{ padding: '0.5rem', flex: 1 }}
          />
          <input
            type="text"
            placeholder="専門分野タグ（カンマ区切り）"
            value={personTags}
            onChange={(e) => setPersonTags(e.target.value)}
            style={{ padding: '0.5rem', flex: 1 }}
          />
          <button onClick={handleAddPerson} style={{ padding: '0.5rem 1.5rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px' }}>
            追加
          </button>
        </div>
        <ul style={{ marginTop: '1rem', listStyle: 'none' }}>
          {state.people.map(person => (
            <li key={person.id} style={{ padding: '0.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <span>{person.name} {person.expertiseTags.length > 0 && `(${person.expertiseTags.join(', ')})`}</span>
              <button onClick={() => dispatch({ type: 'DELETE_PERSON', personId: person.id })} style={{ color: 'red', background: 'none', border: 'none' }}>削除</button>
            </li>
          ))}
        </ul>
      </section>

      {/* トピック管理 */}
      <section style={{ marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '8px' }}>
        <h3>トピック管理</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <input
            type="text"
            placeholder="タイトル"
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            style={{ padding: '0.5rem', flex: 1 }}
          />
          <input
            type="text"
            placeholder="説明（任意）"
            value={topicDesc}
            onChange={(e) => setTopicDesc(e.target.value)}
            style={{ padding: '0.5rem', flex: 2 }}
          />
          <button onClick={handleAddTopic} style={{ padding: '0.5rem 1.5rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px' }}>
            追加
          </button>
        </div>
        <ul style={{ marginTop: '1rem', listStyle: 'none' }}>
          {state.topics.map(topic => (
            <li key={topic.id} style={{ padding: '0.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <span>{topic.title} {topic.description && `- ${topic.description}`}</span>
              <button onClick={() => dispatch({ type: 'DELETE_TOPIC', topicId: topic.id })} style={{ color: 'red', background: 'none', border: 'none' }}>削除</button>
            </li>
          ))}
        </ul>
      </section>

      {/* 投票マトリクス */}
      {state.people.length > 0 && state.topics.length > 0 && (
        <section style={{ marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '8px', overflowX: 'auto' }}>
          <h3>投票マトリクス</h3>
          <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '0.5rem', background: '#f8f9fa' }}>人物</th>
                {state.topics.map(topic => (
                  <th key={topic.id} style={{ border: '1px solid #ddd', padding: '0.5rem', background: '#f8f9fa' }}>{topic.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.people.map(person => (
                <tr key={person.id}>
                  <td style={{ border: '1px solid #ddd', padding: '0.5rem', fontWeight: 'bold' }}>{person.name}</td>
                  {state.topics.map(topic => {
                    const ballot = getBallot(person.id, topic.id);
                    return (
                      <td key={topic.id} style={{ border: '1px solid #ddd', padding: '0.5rem' }}>
                        <select
                          value={ballot?.mode || ''}
                          onChange={(e) => {
                            const mode = e.target.value;
                            if (mode === 'direct' || mode === 'delegate') {
                              handleBallotChange(person.id, topic.id, mode, mode === 'direct' ? 'neutral' : '');
                            }
                          }}
                          style={{ width: '100%', marginBottom: '0.25rem' }}
                        >
                          <option value="">未設定</option>
                          <option value="direct">直接投票</option>
                          <option value="delegate">委任</option>
                        </select>
                        {ballot?.mode === 'direct' && (
                          <select
                            value={ballot.stance || 'neutral'}
                            onChange={(e) => handleBallotChange(person.id, topic.id, 'direct', e.target.value)}
                            style={{ width: '100%' }}
                          >
                            <option value="agree">賛成</option>
                            <option value="disagree">反対</option>
                            <option value="neutral">中立</option>
                          </select>
                        )}
                        {ballot?.mode === 'delegate' && (
                          <select
                            value={ballot.delegateTo || ''}
                            onChange={(e) => handleBallotChange(person.id, topic.id, 'delegate', e.target.value)}
                            style={{ width: '100%' }}
                          >
                            <option value="">選択...</option>
                            {state.people.filter(p => p.id !== person.id).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <button
        onClick={() => navigate('/results')}
        style={{
          marginTop: '2rem',
          padding: '1rem 2rem',
          background: '#27ae60',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '1.1rem',
          fontWeight: 'bold'
        }}
      >
        結果を見る →
      </button>
    </div>
  );
}

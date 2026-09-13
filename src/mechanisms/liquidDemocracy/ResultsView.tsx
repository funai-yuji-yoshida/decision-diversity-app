import { useAppContext } from '../../AppContext';
import { resolveDelegation, aggregateResults } from './resolveDelegation';

export default function ResultsView() {
  const { state } = useAppContext();

  if (state.topics.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>トピックがまだ登録されていません。管理画面からトピックを追加してください。</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h2>結果画面</h2>

      {state.topics.map(topic => {
        // このトピックに関する投票のみを抽出
        const topicBallots = state.ballots.filter(b => b.topicId === topic.id);
        const ballotsMap = new Map(topicBallots.map(b => [`${b.personId}:${b.topicId}`, b]));

        // 委任解決
        const resolutionMap = resolveDelegation(state.people, ballotsMap);

        // 集計
        const aggregation = aggregateResults(resolutionMap);

        // チャート用のデータ
        const maxCount = Math.max(aggregation.agree, aggregation.disagree, aggregation.neutral, aggregation.circular, aggregation.unresolved, 1);

        return (
          <section key={topic.id} style={{ marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '8px' }}>
            <h3>{topic.title}</h3>
            {topic.description && <p style={{ color: '#666', marginTop: '0.5rem' }}>{topic.description}</p>}

            {/* 集計結果 */}
            <div style={{ marginTop: '1.5rem' }}>
              <h4>集計結果</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ padding: '1rem', background: '#d4edda', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{aggregation.agree}</div>
                  <div>賛成</div>
                </div>
                <div style={{ padding: '1rem', background: '#f8d7da', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{aggregation.disagree}</div>
                  <div>反対</div>
                </div>
                <div style={{ padding: '1rem', background: '#fff3cd', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{aggregation.neutral}</div>
                  <div>中立</div>
                </div>
                <div style={{ padding: '1rem', background: '#f0f0f0', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{aggregation.circular}</div>
                  <div>循環委任</div>
                </div>
                <div style={{ padding: '1rem', background: '#e2e3e5', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{aggregation.unresolved}</div>
                  <div>未解決</div>
                </div>
              </div>
            </div>

            {/* 棒グラフ */}
            <div style={{ marginTop: '2rem' }}>
              <h4>視覚化</h4>
              <svg width="100%" height="200" style={{ marginTop: '1rem' }}>
                {/* 賛成 */}
                <rect
                  x="10%"
                  y={150 - (aggregation.agree / maxCount) * 130}
                  width="15%"
                  height={(aggregation.agree / maxCount) * 130}
                  fill="#28a745"
                />
                <text x="17.5%" y="170" textAnchor="middle" fontSize="12">賛成 ({aggregation.agree})</text>

                {/* 反対 */}
                <rect
                  x="28%"
                  y={150 - (aggregation.disagree / maxCount) * 130}
                  width="15%"
                  height={(aggregation.disagree / maxCount) * 130}
                  fill="#dc3545"
                />
                <text x="35.5%" y="170" textAnchor="middle" fontSize="12">反対 ({aggregation.disagree})</text>

                {/* 中立 */}
                <rect
                  x="46%"
                  y={150 - (aggregation.neutral / maxCount) * 130}
                  width="15%"
                  height={(aggregation.neutral / maxCount) * 130}
                  fill="#ffc107"
                />
                <text x="53.5%" y="170" textAnchor="middle" fontSize="12">中立 ({aggregation.neutral})</text>

                {/* 循環 */}
                <rect
                  x="64%"
                  y={150 - (aggregation.circular / maxCount) * 130}
                  width="15%"
                  height={(aggregation.circular / maxCount) * 130}
                  fill="#6c757d"
                />
                <text x="71.5%" y="170" textAnchor="middle" fontSize="12">循環 ({aggregation.circular})</text>

                {/* 未解決 */}
                <rect
                  x="82%"
                  y={150 - (aggregation.unresolved / maxCount) * 130}
                  width="15%"
                  height={(aggregation.unresolved / maxCount) * 130}
                  fill="#adb5bd"
                />
                <text x="89.5%" y="170" textAnchor="middle" fontSize="12">未解決 ({aggregation.unresolved})</text>
              </svg>
            </div>

            {/* 委任ネットワーク図 */}
            {topicBallots.some(b => b.mode === 'delegate') && (
              <div style={{ marginTop: '2rem' }}>
                <h4>委任ネットワーク</h4>
                <DelegationNetwork
                  people={state.people}
                  ballots={topicBallots}
                  resolutionMap={resolutionMap}
                />
              </div>
            )}

            {/* 個人別の詳細 */}
            <div style={{ marginTop: '2rem' }}>
              <h4>個人別の解決結果</h4>
              <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: '0.5rem', background: '#f8f9fa', textAlign: 'left' }}>名前</th>
                    <th style={{ border: '1px solid #ddd', padding: '0.5rem', background: '#f8f9fa', textAlign: 'left' }}>投票方法</th>
                    <th style={{ border: '1px solid #ddd', padding: '0.5rem', background: '#f8f9fa', textAlign: 'left' }}>最終結果</th>
                    <th style={{ border: '1px solid #ddd', padding: '0.5rem', background: '#f8f9fa', textAlign: 'left' }}>委任チェーン</th>
                  </tr>
                </thead>
                <tbody>
                  {state.people.map(person => {
                    const ballot = topicBallots.find(b => b.personId === person.id);
                    const result = resolutionMap.get(person.id);

                    return (
                      <tr key={person.id}>
                        <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{person.name}</td>
                        <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>
                          {ballot ? (ballot.mode === 'direct' ? '直接投票' : `委任先: ${state.people.find(p => p.id === ballot.delegateTo)?.name || '不明'}`) : '未投票'}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            background: getStanceColor(result?.stance || 'unresolved'),
                            color: 'white',
                            fontSize: '0.9rem'
                          }}>
                            {getStanceLabel(result?.stance || 'unresolved')}
                          </span>
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                          {result?.delegationChain && result.delegationChain.length > 0
                            ? result.delegationChain.map(id => state.people.find(p => p.id === id)?.name || id).join(' → ')
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function DelegationNetwork({ people, ballots, resolutionMap }: {
  people: Array<{ id: string; name: string }>;
  ballots: Array<{ personId: string; mode: string; delegateTo?: string }>;
  resolutionMap: Map<string, { stance: string; delegationChain?: string[] }>;
}) {
  const width = 800;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 150;

  // 人物の位置を円周上に配置
  const positions = new Map<string, { x: number; y: number }>();
  people.forEach((person, index) => {
    const angle = (index / people.length) * 2 * Math.PI - Math.PI / 2;
    positions.set(person.id, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
      {/* 委任の矢印 */}
      {ballots
        .filter(b => b.mode === 'delegate' && b.delegateTo)
        .map(ballot => {
          const from = positions.get(ballot.personId);
          const to = positions.get(ballot.delegateTo!);
          if (!from || !to) return null;

          const result = resolutionMap.get(ballot.personId);
          const isCircular = result?.stance === 'circular';

          return (
            <g key={`${ballot.personId}-${ballot.delegateTo}`}>
              <defs>
                <marker
                  id={`arrow-${ballot.personId}`}
                  markerWidth="10"
                  markerHeight="10"
                  refX="8"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill={isCircular ? '#dc3545' : '#666'} />
                </marker>
              </defs>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isCircular ? '#dc3545' : '#666'}
                strokeWidth="2"
                markerEnd={`url(#arrow-${ballot.personId})`}
                opacity="0.6"
              />
            </g>
          );
        })}

      {/* 人物ノード */}
      {people.map(person => {
        const pos = positions.get(person.id);
        if (!pos) return null;

        const result = resolutionMap.get(person.id);
        const color = getStanceColor(result?.stance || 'unresolved');

        return (
          <g key={person.id}>
            <circle cx={pos.x} cy={pos.y} r="25" fill={color} stroke="white" strokeWidth="3" />
            <text
              x={pos.x}
              y={pos.y + 40}
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
            >
              {person.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function getStanceColor(stance: string): string {
  switch (stance) {
    case 'agree': return '#28a745';
    case 'disagree': return '#dc3545';
    case 'neutral': return '#ffc107';
    case 'circular': return '#6c757d';
    case 'unresolved': return '#adb5bd';
    default: return '#adb5bd';
  }
}

function getStanceLabel(stance: string): string {
  switch (stance) {
    case 'agree': return '賛成';
    case 'disagree': return '反対';
    case 'neutral': return '中立';
    case 'circular': return '循環';
    case 'unresolved': return '未解決';
    default: return '不明';
  }
}

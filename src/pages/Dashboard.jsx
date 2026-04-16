import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../services/api.js';

function formatDate(d) {
  return new Date(d).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDim(m) {
  return `${parseFloat(m.largura)}×${parseFloat(m.comprimento)}×${parseFloat(m.espessura)} mm`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const res = await getDashboard();
      setData(res.data);
    } catch (e) {
      setError('Não foi possível carregar o dashboard. Verifique se o servidor está a correr.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div>
      <div className="topbar"><div><h1>Dashboard</h1><p>Resumo do stock</p></div></div>
      <div className="page-content"><p className="text-muted">A carregar…</p></div>
    </div>
  );

  if (error) return (
    <div>
      <div className="topbar"><div><h1>Dashboard</h1></div></div>
      <div className="page-content"><div className="alert alert-danger">{error}</div></div>
    </div>
  );

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral do stock de matérias-primas</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}>↺ Atualizar</button>
      </div>

      <div className="page-content">
        {/* Estatísticas */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon blue">📦</div>
            <div>
              <div className="stat-value">{data.total_materiais}</div>
              <div className="stat-label">Matérias-Primas</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">⚠️</div>
            <div>
              <div className="stat-value">{data.total_alertas}</div>
              <div className="stat-label">Alertas de Stock Baixo</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">📋</div>
            <div>
              <div className="stat-value">{data.movimentos_hoje}</div>
              <div className="stat-label">Movimentos Hoje</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Alertas */}
          <div className="card">
            <div className="card-header">
              <h3>⚠️ Stock Abaixo do Mínimo</h3>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/materia-prima')}>
                Ver tudo
              </button>
            </div>
            {data.alertas.length === 0 ? (
              <div className="empty"><div className="empty-icon">✅</div><p>Todos os stocks estão acima do mínimo</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Dimensões (mm)</th>
                      <th>Stock</th>
                      <th>Mínimo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.alertas.map((m) => (
                      <tr key={m.id}>
                        <td>{m.descricao}</td>
                        <td className="font-mono text-muted">{formatDim(m)}</td>
                        <td><span className="badge badge-red">{parseFloat(m.quantidade).toFixed(2)}</span></td>
                        <td>{parseFloat(m.estoque_minimo).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Movimentos recentes */}
          <div className="card">
            <div className="card-header">
              <h3>🕐 Últimos Movimentos</h3>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/movimentacoes')}>
                Ver todos
              </button>
            </div>
            {data.recentes.length === 0 ? (
              <div className="empty"><div className="empty-icon">📋</div><p>Ainda não há movimentos</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Tipo</th>
                      <th>Qtd</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentes.map((m) => (
                      <tr key={m.id}>
                        <td>{m.descricao}</td>
                        <td>
                          <span className={`badge ${m.quer_reduzir ? 'badge-red' : 'badge-green'}`}>
                            {m.quer_reduzir ? '↓ Saída' : '↑ Entrada'}
                          </span>
                        </td>
                        <td className="font-mono">{parseFloat(m.quantidade).toFixed(2)}</td>
                        <td className="text-muted">{formatDate(m.data)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

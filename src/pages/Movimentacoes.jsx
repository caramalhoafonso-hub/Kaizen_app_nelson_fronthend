import { useEffect, useState } from 'react';
import { getMovimentacoes, getMateriaPrima } from '../services/api.js';

function formatDate(d) {
  return new Date(d).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function Movimentacoes() {
  const [movimentos, setMovimentos] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filtros, setFiltros] = useState({
    materia_prima_id: '',
    data_inicio: '',
    data_fim: '',
    tipo: '',
  });

  const load = async (f) => {
    try {
      setLoading(true);
      const params = {};
      if (f.materia_prima_id) params.materia_prima_id = f.materia_prima_id;
      if (f.data_inicio)      params.data_inicio      = f.data_inicio;
      if (f.data_fim)         params.data_fim         = f.data_fim;
      if (f.tipo)             params.tipo             = f.tipo;
      const res = await getMovimentacoes(params);
      setMovimentos(res.data);
    } catch {
      setError('Erro ao carregar movimentações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMateriaPrima().then((r) => setMateriais(r.data)).catch(() => {});
    load(filtros);
  }, []);

  const handleFiltro = (e) => {
    const novo = { ...filtros, [e.target.name]: e.target.value };
    setFiltros(novo);
    load(novo);
  };

  const limparFiltros = () => {
    const vazio = { materia_prima_id: '', data_inicio: '', data_fim: '', tipo: '' };
    setFiltros(vazio);
    load(vazio);
  };

  const totalEntradas = movimentos.filter((m) => !m.quer_reduzir).reduce((s, m) => s + parseFloat(m.quantidade), 0);
  const totalSaidas   = movimentos.filter((m) =>  m.quer_reduzir).reduce((s, m) => s + parseFloat(m.quantidade), 0);

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Movimentações</h1>
          <p>Histórico de todas as entradas e saídas de stock</p>
        </div>
      </div>

      <div className="page-content">
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Filtros */}
        <div className="card mb-16">
          <div className="card-header">
            <h3>Filtros</h3>
            <button className="btn btn-outline btn-sm" onClick={limparFiltros}>Limpar filtros</button>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label>Matéria-Prima</label>
                <select name="materia_prima_id" value={filtros.materia_prima_id} onChange={handleFiltro}>
                  <option value="">Todas</option>
                  {materiais.map((m) => (
                    <option key={m.id} value={m.id}>{m.descricao} ({parseFloat(m.largura).toFixed(2)}×{parseFloat(m.comprimento).toFixed(2)}×{parseFloat(m.espessura).toFixed(2)})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select name="tipo" value={filtros.tipo} onChange={handleFiltro}>
                  <option value="">Todos</option>
                  <option value="entrada">Entradas</option>
                  <option value="saida">Saídas</option>
                </select>
              </div>
              <div className="form-group">
                <label>Data Início</label>
                <input type="date" name="data_inicio" value={filtros.data_inicio} onChange={handleFiltro} />
              </div>
              <div className="form-group">
                <label>Data Fim</label>
                <input type="date" name="data_fim" value={filtros.data_fim} onChange={handleFiltro} />
              </div>
            </div>
          </div>
        </div>

        {/* Resumo */}
        {!loading && movimentos.length > 0 && (
          <div className="stat-grid mb-16" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-icon blue">📋</div>
              <div>
                <div className="stat-value">{movimentos.length}</div>
                <div className="stat-label">Total de Movimentos</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">↑</div>
              <div>
                <div className="stat-value">{totalEntradas.toFixed(2)}</div>
                <div className="stat-label">Total Entradas</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">↓</div>
              <div>
                <div className="stat-value">{totalSaidas.toFixed(2)}</div>
                <div className="stat-label">Total Saídas</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabela */}
        <div className="card">
          <div className="card-header">
            <h3>Histórico ({movimentos.length})</h3>
          </div>
          {loading ? (
            <div className="card-body"><p className="text-muted">A carregar…</p></div>
          ) : movimentos.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📋</div>
              <p>Nenhuma movimentação encontrada.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Data</th>
                    <th>Matéria-Prima</th>
                    <th>Dimensões (mm)</th>
                    <th>Tipo</th>
                    <th>Quantidade</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentos.map((m) => (
                    <tr key={m.id}>
                      <td className="text-muted font-mono">{m.id}</td>
                      <td className="text-muted">{formatDate(m.data)}</td>
                      <td style={{ fontWeight: 600 }}>{m.descricao}</td>
                      <td className="font-mono text-muted">
                        {parseFloat(m.largura).toFixed(2)}×{parseFloat(m.comprimento).toFixed(2)}×{parseFloat(m.espessura).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${m.quer_reduzir ? 'badge-red' : 'badge-green'}`}>
                          {m.quer_reduzir ? '↓ Saída' : '↑ Entrada'}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontWeight: 600 }}>
                        <span style={{ color: m.quer_reduzir ? 'var(--danger)' : 'var(--success)' }}>
                          {m.quer_reduzir ? '-' : '+'}{parseFloat(m.quantidade).toFixed(2)}
                        </span>
                      </td>
                      <td className="text-muted">{m.observacao || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

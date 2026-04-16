import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  getMateriaPrima, createMateriaPrima, updateMateriaPrima, deleteMateriaPrima, registarMovimento
} from '../services/api.js';

const emptyForm = {
  descricao: '', largura: '', comprimento: '', espessura: '',
  quantidade: '', estoque_minimo: '', estoque_maximo: '',
};

export default function MateriaPrima() {
  const [lista, setLista] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [qrModal, setQrModal] = useState(null); // material para mostrar QR
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Modal de movimento rápido
  const [movModal, setMovModal] = useState(null); // material selecionado
  const [movQuerReduzir, setMovQuerReduzir] = useState(false);
  const [movQuantidade, setMovQuantidade] = useState('');
  const [movObservacao, setMovObservacao] = useState('');
  const [movSaving, setMovSaving] = useState(false);
  const [movError, setMovError] = useState(null);
  const [movSuccess, setMovSuccess] = useState(null);

  const openMovModal = (item) => {
    setMovModal(item);
    setMovQuerReduzir(false);
    setMovQuantidade('');
    setMovObservacao('');
    setMovError(null);
    setMovSuccess(null);
  };

  const closeMovModal = () => { setMovModal(null); };

  const handleMovSubmit = async (e) => {
    e.preventDefault();
    if (!movQuantidade || parseFloat(movQuantidade) <= 0) {
      setMovError('Insira uma quantidade válida.');
      return;
    }
    setMovSaving(true);
    setMovError(null);
    try {
      const res = await registarMovimento({
        materia_prima_id: movModal.id,
        quer_reduzir: movQuerReduzir,
        quantidade: parseFloat(movQuantidade),
        observacao: movObservacao || null,
      });
      setMovSuccess(`Movimento registado! Novo stock: ${parseFloat(res.data.nova_quantidade).toFixed(2)}`);
      setMovModal((p) => ({ ...p, quantidade: res.data.nova_quantidade }));
      setMovQuantidade('');
      setMovObservacao('');
      load(search);
    } catch (err) {
      setMovError(err.response?.data?.error || 'Erro ao registar movimento.');
    } finally {
      setMovSaving(false);
    }
  };

  const load = async (s) => {
    try {
      setLoading(true);
      const res = await getMateriaPrima(s);
      setLista(res.data);
    } catch {
      setError('Erro ao carregar matérias-primas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(search);
  };

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      descricao: item.descricao,
      largura: item.largura,
      comprimento: item.comprimento,
      espessura: item.espessura,
      quantidade: item.quantidade,
      estoque_minimo: item.estoque_minimo,
      estoque_maximo: item.estoque_maximo,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditItem(null); };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        descricao: form.descricao.trim(),
        largura: parseFloat(form.largura),
        comprimento: parseFloat(form.comprimento),
        espessura: parseFloat(form.espessura),
        quantidade: parseFloat(form.quantidade) || 0,
        estoque_minimo: parseFloat(form.estoque_minimo) || 0,
        estoque_maximo: parseFloat(form.estoque_maximo) || 0,
      };
      if (editItem) {
        await updateMateriaPrima(editItem.id, payload);
      } else {
        await createMateriaPrima(payload);
      }
      closeModal();
      load(search);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Eliminar "${item.descricao}"? Esta ação também apagará todas as movimentações associadas.`)) return;
    try {
      await deleteMateriaPrima(item.id);
      load(search);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao eliminar');
    }
  };

  const stockStatus = (m) => {
    const q = parseFloat(m.quantidade);
    const min = parseFloat(m.estoque_minimo);
    const max = parseFloat(m.estoque_maximo);
    if (min > 0 && q <= min) return { cls: 'badge-red',   label: '⚠ Baixo'  };
    if (max > 0 && q >= max) return { cls: 'badge-amber', label: '⬆ Cheio'  };
    return { cls: 'badge-green', label: '✓ Normal' };
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Matéria-Prima</h1>
          <p>Gestão do catálogo de matérias-primas</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nova Matéria-Prima</button>
      </div>

      <div className="page-content">
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card">
          <div className="card-header">
            <h3>Lista de Materiais ({lista.length})</h3>
            <form className="search-bar" onSubmit={handleSearch}>
              <input
                placeholder="Pesquisar por descrição…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn btn-outline btn-sm" type="submit">Pesquisar</button>
              {search && (
                <button className="btn btn-outline btn-sm" type="button" onClick={() => { setSearch(''); load(''); }}>
                  Limpar
                </button>
              )}
            </form>
          </div>

          {loading ? (
            <div className="card-body"><p className="text-muted">A carregar…</p></div>
          ) : lista.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📦</div>
              <p>Nenhuma matéria-prima encontrada.</p>
              <button className="btn btn-primary mt-16" onClick={openCreate}>Adicionar a primeira</button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Descrição</th>
                    <th>Larg. (mm)</th>
                    <th>Comp. (mm)</th>
                    <th>Esp. (mm)</th>
                    <th>Quantidade</th>
                    <th>Mín.</th>
                    <th>Máx.</th>
                    <th>Estado</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((m) => {
                    const st = stockStatus(m);
                    return (
                      <tr key={m.id}>
                        <td className="text-muted font-mono">#{m.id}</td>
                        <td style={{ fontWeight: 600 }}>{m.descricao}</td>
                        <td className="font-mono">{parseFloat(m.largura).toFixed(2)}</td>
                        <td className="font-mono">{parseFloat(m.comprimento).toFixed(2)}</td>
                        <td className="font-mono">{parseFloat(m.espessura).toFixed(2)}</td>
                        <td className="font-mono" style={{ fontWeight: 600 }}>{parseFloat(m.quantidade).toFixed(2)}</td>
                        <td className="font-mono text-muted">{parseFloat(m.estoque_minimo).toFixed(2)}</td>
                        <td className="font-mono text-muted">{parseFloat(m.estoque_maximo).toFixed(2)}</td>
                        <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        <td>
                          <div className="flex-gap">
                            <button className="btn btn-success btn-sm" onClick={() => openMovModal(m)} title="Registar entrada/saída de stock">
                              + Stock
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => setQrModal(m)} title="Ver QR Code">
                              QR
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => openEdit(m)}>Editar</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m)}>Apagar</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar / Editar */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editItem ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger">{formError}</div>}

                <div className="form-group">
                  <label>Descrição *</label>
                  <input name="descricao" value={form.descricao} onChange={handleChange} required placeholder="Ex: Chapa de Aço" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Largura (mm) *</label>
                    <input name="largura" type="number" step="0.001" min="0" value={form.largura} onChange={handleChange} required placeholder="0.000" />
                  </div>
                  <div className="form-group">
                    <label>Comprimento (mm) *</label>
                    <input name="comprimento" type="number" step="0.001" min="0" value={form.comprimento} onChange={handleChange} required placeholder="0.000" />
                  </div>
                  <div className="form-group">
                    <label>Espessura (mm) *</label>
                    <input name="espessura" type="number" step="0.001" min="0" value={form.espessura} onChange={handleChange} required placeholder="0.000" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Quantidade Inicial</label>
                    <input name="quantidade" type="number" step="0.001" min="0" value={form.quantidade} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Estoque Mínimo</label>
                    <input name="estoque_minimo" type="number" step="0.001" min="0" value={form.estoque_minimo} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Estoque Máximo</label>
                    <input name="estoque_maximo" type="number" step="0.001" min="0" value={form.estoque_maximo} onChange={handleChange} placeholder="0" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : (editItem ? 'Guardar Alterações' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Movimento Rápido */}
      {movModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeMovModal()}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Registar Movimento</h3>
              <button className="modal-close" onClick={closeMovModal}>✕</button>
            </div>
            <div className="modal-body">
              {/* Info do material */}
              <div style={{
                background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <p style={{ fontWeight: 700 }}>{movModal.descricao}</p>
                  <p className="text-muted font-mono">
                    {parseFloat(movModal.largura).toFixed(2)}×{parseFloat(movModal.comprimento).toFixed(2)}×{parseFloat(movModal.espessura).toFixed(2)} mm
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="text-muted" style={{ fontSize: 11 }}>Stock actual</p>
                  <p style={{ fontWeight: 700, fontSize: 20 }}>{parseFloat(movModal.quantidade).toFixed(2)}</p>
                </div>
              </div>

              {movSuccess && <div className="alert alert-success">{movSuccess}</div>}
              {movError   && <div className="alert alert-danger">{movError}</div>}

              <form onSubmit={handleMovSubmit}>
                <div className="form-group">
                  <label>Tipo de Movimento *</label>
                  <div className="flex-gap" style={{ marginTop: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}>
                      <input type="radio" name="mov_tipo" checked={!movQuerReduzir}
                        onChange={() => setMovQuerReduzir(false)} style={{ width: 'auto' }} />
                      <span style={{ color: 'var(--success)' }}>↑ Entrada</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}>
                      <input type="radio" name="mov_tipo" checked={movQuerReduzir}
                        onChange={() => setMovQuerReduzir(true)} style={{ width: 'auto' }} />
                      <span style={{ color: 'var(--danger)' }}>↓ Saída</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Quantidade *</label>
                  <input
                    type="number" step="0.001" min="0.001"
                    value={movQuantidade}
                    onChange={(e) => setMovQuantidade(e.target.value)}
                    placeholder="0.000"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Observação</label>
                  <textarea
                    value={movObservacao}
                    onChange={(e) => setMovObservacao(e.target.value)}
                    placeholder="Opcional…"
                    rows={2}
                  />
                </div>

                <div className="modal-footer" style={{ padding: '0', border: 'none', marginTop: 4 }}>
                  <button type="button" className="btn btn-outline" onClick={closeMovModal}>Fechar</button>
                  <button
                    type="submit"
                    className={`btn ${movQuerReduzir ? 'btn-danger' : 'btn-success'}`}
                    disabled={movSaving}
                  >
                    {movSaving ? <span className="spinner" /> : movQuerReduzir ? '↓ Registar Saída' : '↑ Registar Entrada'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {qrModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setQrModal(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3>QR Code — #{qrModal.id}</h3>
              <button className="modal-close" onClick={() => setQrModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="qr-wrapper">
                <QRCodeSVG
                  value={`MATERIA_PRIMA:${qrModal.id}`}
                  size={220}
                  level="H"
                  includeMargin
                />
              </div>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{qrModal.descricao}</p>
                <p className="text-muted">
                  {parseFloat(qrModal.largura).toFixed(2)}×{parseFloat(qrModal.comprimento).toFixed(2)}×{parseFloat(qrModal.espessura).toFixed(2)} mm
                </p>
                <p className="text-muted" style={{ marginTop: 4 }}>
                  Stock actual: <strong>{parseFloat(qrModal.quantidade).toFixed(2)}</strong>
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setQrModal(null)}>Fechar</button>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨 Imprimir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

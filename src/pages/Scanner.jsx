import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getMateriaPrimaById, registarMovimento } from '../services/api.js';

export default function Scanner() {
  const scannerRef = useRef(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [scannedId, setScannedId] = useState(null);
  const [material, setMaterial] = useState(null);
  const [loadingMat, setLoadingMat] = useState(false);
  const [matError, setMatError] = useState(null);

  // Formulário de movimento
  const [querReduzir, setQuerReduzir] = useState(false);
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Entrada manual de ID
  const [manualId, setManualId] = useState('');

  const initScanner = () => {
    if (scannerRef.current) return; // já iniciado
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 260, height: 260 }, rememberLastUsedCamera: true },
      false
    );
    scanner.render(
      (text) => {
        scanner.clear().catch(() => {});
        scannerRef.current = null;
        parseQR(text);
      },
      () => {}
    );
    scannerRef.current = scanner;
  };

  useEffect(() => {
    setScannerReady(true);
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (scannerReady && !scannedId) {
      // pequeno delay para o DOM estar pronto
      const t = setTimeout(() => initScanner(), 200);
      return () => clearTimeout(t);
    }
  }, [scannerReady, scannedId]);

  const parseQR = async (text) => {
    let id = null;
    if (text.startsWith('MATERIA_PRIMA:')) {
      id = text.replace('MATERIA_PRIMA:', '').trim();
    } else if (!isNaN(parseInt(text))) {
      id = text.trim();
    }
    if (!id) {
      setMatError('QR Code inválido. Certifique-se de que leu um código de matéria-prima.');
      return;
    }
    fetchMaterial(id);
  };

  const fetchMaterial = async (id) => {
    setScannedId(id);
    setLoadingMat(true);
    setMatError(null);
    setMaterial(null);
    setSubmitSuccess(null);
    setSubmitError(null);
    setQuantidade('');
    setObservacao('');
    setQuerReduzir(false);
    try {
      const res = await getMateriaPrimaById(id);
      setMaterial(res.data);
    } catch (err) {
      setMatError(err.response?.status === 404 ? 'Matéria-prima não encontrada.' : 'Erro ao carregar matéria-prima.');
    } finally {
      setLoadingMat(false);
    }
  };

  const handleManual = (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    fetchMaterial(manualId.trim());
    setManualId('');
  };

  const resetScanner = () => {
    setScannedId(null);
    setMaterial(null);
    setMatError(null);
    setSubmitSuccess(null);
    setSubmitError(null);
    scannerRef.current = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantidade || parseFloat(quantidade) <= 0) {
      setSubmitError('Insira uma quantidade válida (maior que zero).');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await registarMovimento({
        materia_prima_id: material.id,
        quer_reduzir: querReduzir,
        quantidade: parseFloat(quantidade),
        observacao: observacao || null,
      });
      setSubmitSuccess(`Movimento registado! Novo stock: ${parseFloat(res.data.nova_quantidade).toFixed(2)}`);
      setMaterial((p) => ({ ...p, quantidade: res.data.nova_quantidade }));
      setQuantidade('');
      setObservacao('');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Erro ao registar movimento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Scanner QR Code</h1>
          <p>Leia o código QR para registar entradas ou saídas de stock</p>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 640, margin: '0 auto' }}>
        {!scannedId ? (
          <>
            {/* Scanner de câmara */}
            <div className="card mb-16">
              <div className="card-header"><h3>📷 Scanner de Câmara</h3></div>
              <div className="card-body">
                {matError && <div className="alert alert-danger mb-16">{matError}</div>}
                <div id="qr-reader" />
              </div>
            </div>

            {/* Entrada manual */}
            <div className="card">
              <div className="card-header"><h3>✏️ Inserir ID Manualmente</h3></div>
              <div className="card-body">
                <form className="flex-gap" onSubmit={handleManual}>
                  <input
                    style={{ flex: 1 }}
                    type="number"
                    min="1"
                    placeholder="ID da matéria-prima…"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                  />
                  <button className="btn btn-primary" type="submit">Carregar</button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="card">
            <div className="card-header">
              <h3>
                {loadingMat ? 'A carregar…' : material ? `📦 ${material.descricao}` : 'Material'}
              </h3>
              <button className="btn btn-outline btn-sm" onClick={resetScanner}>← Novo scan</button>
            </div>
            <div className="card-body">
              {loadingMat && <p className="text-muted">A carregar matéria-prima…</p>}
              {matError && <div className="alert alert-danger">{matError}</div>}

              {material && (
                <>
                  {/* Info do material */}
                  <div style={{
                    background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20,
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px'
                  }}>
                    <div><span className="text-muted">Descrição</span><br /><strong>{material.descricao}</strong></div>
                    <div><span className="text-muted">Stock Actual</span><br /><strong style={{ fontSize: 18 }}>{parseFloat(material.quantidade).toFixed(2)}</strong></div>
                    <div><span className="text-muted">Dimensões (mm)</span><br /><span className="font-mono">{parseFloat(material.largura).toFixed(2)}×{parseFloat(material.comprimento).toFixed(2)}×{parseFloat(material.espessura).toFixed(2)}</span></div>
                    <div><span className="text-muted">Mín / Máx</span><br /><span className="font-mono">{parseFloat(material.estoque_minimo).toFixed(2)} / {parseFloat(material.estoque_maximo).toFixed(2)}</span></div>
                  </div>

                  {submitSuccess && <div className="alert alert-success">{submitSuccess}</div>}
                  {submitError  && <div className="alert alert-danger">{submitError}</div>}

                  {/* Formulário de movimento */}
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label>Tipo de Movimento *</label>
                      <div className="flex-gap" style={{ marginTop: 6 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}>
                          <input
                            type="radio" name="tipo"
                            checked={!querReduzir}
                            onChange={() => setQuerReduzir(false)}
                            style={{ width: 'auto' }}
                          />
                          <span style={{ color: 'var(--success)' }}>↑ Entrada (Adicionar Stock)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}>
                          <input
                            type="radio" name="tipo"
                            checked={querReduzir}
                            onChange={() => setQuerReduzir(true)}
                            style={{ width: 'auto' }}
                          />
                          <span style={{ color: 'var(--danger)' }}>↓ Saída (Remover Stock)</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Quantidade *</label>
                      <input
                        type="number" step="0.001" min="0.001"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        placeholder="0.000"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label>Observação</label>
                      <textarea
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                        placeholder="Opcional…"
                        rows={2}
                      />
                    </div>

                    <button
                      type="submit"
                      className={`btn ${querReduzir ? 'btn-danger' : 'btn-success'}`}
                      style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                      disabled={submitting}
                    >
                      {submitting
                        ? <span className="spinner" />
                        : querReduzir
                          ? '↓ Registar Saída'
                          : '↑ Registar Entrada'
                      }
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

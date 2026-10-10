
import { useEffect, useMemo, useState } from "react";
import {
  Activity, BrainCircuit, LayoutDashboard, ScanHeart,
  History, ChartNoAxesCombined, Settings, Bell, Search,
  ArrowUpRight, ArrowRight, Plus, Trash2, RefreshCw,
  ShieldCheck, Sparkles, HeartPulse, Clock3, X,
  CheckCircle2, AlertCircle, Menu
} from "lucide-react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/predict";
const STORAGE_KEY = "diacare_prediction_records_v1";

const fields = [
  { name: "Pregnancies", label: "Pregnancies", unit: "count", min: 0, max: 30, step: 1 },
  { name: "Glucose", label: "Glucose", unit: "mg/dL", min: 1, max: 500, step: 1 },
  { name: "BloodPressure", label: "Blood pressure", unit: "mmHg", min: 1, max: 300, step: 1 },
  { name: "SkinThickness", label: "Skin thickness", unit: "mm", min: 0, max: 150, step: 1 },
  { name: "Insulin", label: "Insulin", unit: "µU/mL", min: 0, max: 3000, step: 1 },
  { name: "BMI", label: "BMI", unit: "kg/m²", min: 0.1, max: 100, step: 0.1 },
  { name: "DiabetesPedigreeFunction", label: "Pedigree function", unit: "score", min: 0, max: 10, step: 0.001 },
  { name: "Age", label: "Age", unit: "years", min: 1, max: 120, step: 1 },
];

const emptyForm = Object.fromEntries(fields.map((f) => [f.name, ""]));

function readRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function dateLabel(value) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function MetricCard({ icon: Icon, label, value, note, color }) {
  return (
    <article className={`metric-card glow-${color}`}>
      <div className="metric-top">
        <span className={`metric-icon ${color}`}><Icon size={20} /></span>
        <ArrowUpRight size={17} className="muted-icon" />
      </div>
      <p>{label}</p>
      <h3>{value}</h3>
      <span className="metric-note">{note}</span>
    </article>
  );
}

function App() {
  const [page, setPage] = useState("Overview");
  const [records, setRecords] = useState(readRecords);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      setError("Browser storage is full. Delete older records to continue saving.");
    }
  }, [records]);

  const positiveCount = records.filter((r) => r.prediction === 1).length;
  const negativeCount = records.length - positiveCount;

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...records]
      .reverse()
      .filter((r) =>
        !query ||
        String(r.id).toLowerCase().includes(query) ||
        r.result.toLowerCase().includes(query) ||
        dateLabel(r.createdAt).toLowerCase().includes(query)
      );
  }, [records, search]);

  const maxBar = Math.max(positiveCount, negativeCount, 1);

  function navigate(name) {
    setPage(name);
    setMenuOpen(false);
    setError("");
    setResult(null);
    setSelectedRecord(null);
  }

  function updateField(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function submitPrediction(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    for (const field of fields) {
      const raw = form[field.name];
      const number = Number(raw);

      if (raw === "" || !Number.isFinite(number)) {
        setError(`Please enter a valid ${field.label.toLowerCase()}.`);
        return;
      }
      if (number < field.min || number > field.max) {
        setError(`${field.label} must be between ${field.min} and ${field.max}.`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = Object.fromEntries(
        fields.map((f) => [f.name, Number(form[f.name])])
      );

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "The backend rejected the request. Check the entered measurements."
        );
      }

      const record = {
        id: `DC-${Date.now().toString(36).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        inputs: payload,
        prediction: Number(data.prediction),
        result: data.result,
        probability: Number(data.model_probability),
      };

      setRecords((previous) => [...previous, record]);
      setResult(record);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot reach FastAPI. Make sure the backend is running on port 8000."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  function deleteRecord(id) {
    setRecords((previous) => previous.filter((r) => r.id !== id));
    if (selectedRecord?.id === id) setSelectedRecord(null);
  }

  function clearRecords() {
    if (window.confirm("Delete all saved prediction records from this browser?")) {
      setRecords([]);
      setSelectedRecord(null);
    }
  }

  const navigation = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "New prediction", icon: ScanHeart },
    { name: "Records", icon: History },
    { name: "Analytics", icon: ChartNoAxesCombined },
  ];

  return (
    <div className="app">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <a className="logo" href="#overview" onClick={(e) => { e.preventDefault(); navigate("Overview"); }}>
          <span className="logo-mark"><Activity size={24} /></span>
          <span>dia<span className="logo-accent">care</span><small>INTELLIGENCE STUDIO</small></span>
        </a>

        <div className="side-caption">WORKSPACE</div>
        <nav className="side-nav">
          {navigation.map(({ name, icon: Icon }) => (
            <button key={name} className={page === name ? "nav-item active" : "nav-item"} onClick={() => navigate(name)}>
              <Icon size={19} />
              <span>{name}</span>
              {name === "Records" && records.length > 0 && <span className="nav-count">{records.length}</span>}
            </button>
          ))}
        </nav>

        <div className="side-caption tools-caption">SYSTEM</div>
        <div className="system-card">
          <span className="system-orb"><BrainCircuit size={20} /></span>
          <div><strong>ML Engine</strong><small>Logistic Regression</small></div>
          <span className="online-dot" />
          <p>Prediction API status must be checked separately.</p>
        </div>

        <div className="sidebar-bottom">
          <div className="profile-avatar">DC</div>
          <div className="profile-info"><strong>Local workspace</strong><small>Educational demo</small></div>
          <Settings size={17} />
        </div>
      </aside>

      {menuOpen && <button className="mobile-overlay" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}><Menu /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{page}</strong></div>
          <div className="top-actions">
            <span className="environment"><span className="online-dot" /> LOCAL ENVIRONMENT</span>
            <button className="icon-button" title="Refresh view" onClick={() => { setError(""); setResult(null); }}><RefreshCw size={17} /></button>
            <span className="top-avatar"><HeartPulse size={19} /></span>
          </div>
        </header>

        <div className="content">
          {page === "Overview" && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><Sparkles size={14} /> PERSONAL HEALTH ML WORKSPACE</div>
                  <h1>Health insights,<br /><span>reimagined.</span></h1>
                  <p>A clean workspace for exploring model predictions and reviewing saved results.</p>
                </div>
                <button className="primary-button" onClick={() => navigate("New prediction")}><Plus size={18} /> New prediction</button>
              </section>

              <section className="metric-grid">
                <MetricCard icon={Activity} label="TOTAL PREDICTIONS" value={records.length} note="Saved in this browser" color="mint" />
                <MetricCard icon={ShieldCheck} label="CLASS 0 RESULTS" value={negativeCount} note="Model predicted class 0" color="blue" />
                <MetricCard icon={ScanHeart} label="CLASS 1 RESULTS" value={positiveCount} note="Model predicted class 1" color="violet" />
                <MetricCard icon={Clock3} label="LATEST ACTIVITY" value={records.length ? dateLabel(records[records.length - 1].createdAt).split(",")[0] : "—"} note="Most recent saved result" color="amber" />
              </section>

              <section className="overview-grid">
                <article className="panel chart-panel">
                  <div className="panel-heading">
                    <div><span className="eyebrow">PREDICTION DISTRIBUTION</span><h2>Model output overview</h2></div>
                    <span className="live-chip"><span className="online-dot" /> LIVE RECORDS</span>
                  </div>
                  <div className="distribution">
                    <div className="distribution-number"><strong>{records.length}</strong><span>Total saved predictions</span></div>
                    <div className="bar-row"><div><span>Class 0</span><strong>{negativeCount}</strong></div><div className="bar-track"><div className="bar-fill mint-fill" style={{ width: `${negativeCount / maxBar * 100}%` }} /></div></div>
                    <div className="bar-row"><div><span>Class 1</span><strong>{positiveCount}</strong></div><div className="bar-track"><div className="bar-fill violet-fill" style={{ width: `${positiveCount / maxBar * 100}%` }} /></div></div>
                  </div>
                  <p className="chart-footnote">Counts describe saved model outputs only; they do not measure disease prevalence.</p>
                </article>

                <article className="panel insight-panel">
                  <div className="insight-icon"><BrainCircuit size={24} /></div>
                  <span className="eyebrow">MODEL SNAPSHOT</span>
                  <h2>Logistic Regression</h2>
                  <p>Your trained pipeline uses imputation, feature scaling, and a classification model.</p>
                  <div className="snapshot-row"><span>Backend endpoint</span><strong>Port 8000</strong></div>
                  <div className="snapshot-row"><span>Record storage</span><strong>Browser local</strong></div>
                  <button className="text-button" onClick={() => navigate("Analytics")}>Explore analytics <ArrowRight size={16} /></button>
                </article>
              </section>

              <section className="panel recent-panel">
                <div className="panel-heading">
                  <div><span className="eyebrow">YOUR WORKSPACE</span><h2>Recent predictions</h2></div>
                  <button className="text-button" onClick={() => navigate("Records")}>View all <ArrowRight size={16} /></button>
                </div>
                {records.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon"><History size={25} /></div><h3>No records yet</h3><p>Run your first prediction to see it appear here.</p><button className="secondary-button" onClick={() => navigate("New prediction")}>Create first record</button></div>
                ) : (
                  <RecordTable records={[...records].reverse().slice(0, 5)} onSelect={setSelectedRecord} onDelete={deleteRecord} />
                )}
              </section>
            </>
          )}

          {page === "New prediction" && (
            <>
              <section className="page-heading">
                <div className="eyebrow"><ScanHeart size={14} /> MODEL INFERENCE</div>
                <h1>New <span>prediction.</span></h1>
                <p>Enter the eight dataset features and submit them to your local FastAPI model.</p>
              </section>

              <div className="prediction-layout">
                <section className="panel prediction-panel">
                  <div className="panel-heading"><div><h2>Patient measurements</h2><p className="subtext">Use sample or de-identified data for this demo.</p></div><span className="form-counter">08 FEATURES</span></div>
                  <form onSubmit={submitPrediction}>
                    <div className="input-grid">
                      {fields.map((field, i) => (
                        <label className="input-field" key={field.name}>
                          <span>{field.label}<small>{field.unit}</small></span>
                          <input type="number" name={field.name} min={field.min} max={field.max} step={field.step} value={form[field.name]} onChange={updateField} placeholder="Enter value" required />
                          <em>FEATURE {String(i + 1).padStart(2, "0")}</em>
                        </label>
                      ))}
                    </div>
                    {error && <div className="error-banner"><AlertCircle size={17} />{error}</div>}
                    <div className="form-bottom"><span><ShieldCheck size={16} /> Demo only · No diagnosis</span><button className="primary-button" type="submit" disabled={loading}>{loading ? "Analyzing..." : "Run model"} <ArrowRight size={17} /></button></div>
                  </form>
                </section>

                <aside className="panel output-panel">
                  <span className="eyebrow">INFERENCE RESULT</span>
                  <div className={`output-orb ${result ? (result.prediction === 1 ? "orb-violet" : "orb-mint") : ""}`}><BrainCircuit size={31} /></div>
                  {!result ? <><h2>Ready when you are.</h2><p>Your result will appear here after the API returns a prediction.</p><div className="waiting-line"><span /> Waiting for input</div></> : <>
                    <h2>{result.prediction === 1 ? "Class 1 predicted" : "Class 0 predicted"}</h2>
                    <p>{result.result}</p>
                    <div className="probability-box"><span>Model probability for class 1</span><strong>{(result.probability * 100).toFixed(1)}%</strong><div className="bar-track"><div className="bar-fill mint-fill" style={{ width: `${Math.min(100, Math.max(0, result.probability * 100))}%` }} /></div></div>
                    <div className="success-banner"><CheckCircle2 size={17} /> Saved to your browser records.</div>
                    <button className="secondary-button full-button" onClick={() => navigate("Records")}>View saved record <ArrowRight size={16} /></button>
                  </>}
                  <div className="disclaimer"><ShieldCheck size={16} /><span>Educational estimate only. Not a medical diagnosis or a substitute for professional care.</span></div>
                </aside>
              </div>
            </>
          )}

          {page === "Records" && (
            <>
              <section className="page-heading">
                <div className="eyebrow"><History size={14} /> LOCAL HISTORY</div>
                <h1>Prediction <span>records.</span></h1>
                <p>Review saved outputs, search records, or remove entries from this browser.</p>
              </section>
              <section className="panel records-panel">
                <div className="records-toolbar"><div className="search-box"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID, result, or date..." /></div><span className="record-total">{filteredRecords.length} records</span><button className="danger-button" onClick={clearRecords} disabled={records.length === 0}><Trash2 size={15} /> Clear all</button></div>
                {filteredRecords.length === 0 ? <div className="empty-state"><div className="empty-icon"><History size={25} /></div><h3>{records.length ? "No matching records" : "Nothing saved yet"}</h3><p>{records.length ? "Try a different search." : "Create a prediction to build your local history."}</p><button className="secondary-button" onClick={() => navigate("New prediction")}>New prediction</button></div> : <RecordTable records={filteredRecords} onSelect={setSelectedRecord} onDelete={deleteRecord} />}
              </section>
              {selectedRecord && <RecordDetails record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
              <p className="storage-note"><ShieldCheck size={15} /> Records are stored in this browser only. They are not synchronized to a server or shared across devices.</p>
            </>
          )}

          {page === "Analytics" && (
            <>
              <section className="page-heading">
                <div className="eyebrow"><ChartNoAxesCombined size={14} /> ANALYTICS STUDIO</div>
                <h1>Explore your <span>outputs.</span></h1>
                <p>Understand how your saved model predictions are distributed.</p>
              </section>
              <section className="metric-grid analytics-metrics">
                <MetricCard icon={Activity} label="TOTAL OUTPUTS" value={records.length} note="Saved model responses" color="mint" />
                <MetricCard icon={CheckCircle2} label="CLASS 0" value={negativeCount} note="Predicted class 0" color="blue" />
                <MetricCard icon={AlertCircle} label="CLASS 1" value={positiveCount} note="Predicted class 1" color="violet" />
                <MetricCard icon={ChartNoAxesCombined} label="AVERAGE CLASS 1 PROBABILITY" value={records.length ? `${(records.reduce((sum, r) => sum + r.probability, 0) / records.length * 100).toFixed(1)}%` : "—"} note="Across saved outputs" color="amber" />
              </section>
              <section className="overview-grid">
                <article className="panel chart-panel">
                  <div className="panel-heading"><div><span className="eyebrow">CLASS DISTRIBUTION</span><h2>Saved outputs</h2></div></div>
                  <div className="distribution">
                    <div className="distribution-number"><strong>{records.length}</strong><span>Total records</span></div>
                    <div className="bar-row"><div><span>Class 0</span><strong>{negativeCount} ({records.length ? (negativeCount / records.length * 100).toFixed(0) : 0}%)</strong></div><div className="bar-track"><div className="bar-fill mint-fill" style={{ width: `${negativeCount / maxBar * 100}%` }} /></div></div>
                    <div className="bar-row"><div><span>Class 1</span><strong>{positiveCount} ({records.length ? (positiveCount / records.length * 100).toFixed(0) : 0}%)</strong></div><div className="bar-track"><div className="bar-fill violet-fill" style={{ width: `${positiveCount / maxBar * 100}%` }} /></div></div>
                  </div>
                  {records.length === 0 && <p className="chart-footnote">Run predictions to populate these charts.</p>}
                </article>
                <article className="panel chart-panel">
                  <div className="panel-heading"><div><span className="eyebrow">PROBABILITY HISTORY</span><h2>Latest model outputs</h2></div></div>
                  {records.length === 0 ? <div className="empty-state compact"><p>No saved predictions to visualize.</p></div> : <div className="probability-history">{records.slice(-8).reverse().map((r) => <div className="history-row" key={r.id}><span>{r.id.slice(-6)}</span><div className="bar-track"><div className={`bar-fill ${r.prediction === 1 ? "violet-fill" : "mint-fill"}`} style={{ width: `${Math.max(0, Math.min(100, r.probability * 100))}%` }} /></div><strong>{(r.probability * 100).toFixed(1)}%</strong></div>)}</div>}
                  <p className="chart-footnote">Probabilities are model outputs, not confirmed medical risks.</p>
                </article>
              </section>
              <section className="panel recent-panel"><div className="panel-heading"><div><span className="eyebrow">AUDIT VIEW</span><h2>Latest activity</h2></div><button className="text-button" onClick={() => navigate("Records")}>Open records <ArrowRight size={16} /></button></div>{records.length ? <RecordTable records={[...records].reverse().slice(0, 5)} onSelect={setSelectedRecord} onDelete={deleteRecord} /> : <div className="empty-state compact"><p>Analytics will update after you save your first prediction.</p></div>}</section>
              {selectedRecord && <RecordDetails record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
            </>
          )}

          <footer className="footer"><span><span className="footer-dot" /> DIACARE INTELLIGENCE STUDIO</span><span>Educational ML demo · Local records</span></footer>
        </div>
      </main>
    </div>
  );
}

function RecordTable({ records, onSelect, onDelete }) {
  return (
    <div className="table-wrap">
      <table className="records-table">
        <thead><tr><th>RECORD ID</th><th>DATE</th><th>MODEL OUTPUT</th><th>CLASS 1 PROBABILITY</th><th>ACTIONS</th></tr></thead>
        <tbody>{records.map((r) => <tr key={r.id}>
          <td><button className="record-link" onClick={() => onSelect(r)}>{r.id}</button></td>
          <td>{dateLabel(r.createdAt)}</td>
          <td><span className={`result-tag ${r.prediction === 1 ? "tag-violet" : "tag-mint"}`}><span />Class {r.prediction}</span></td>
          <td>{(r.probability * 100).toFixed(1)}%</td>
          <td><div className="table-actions"><button title="View details" onClick={() => onSelect(r)}><ArrowUpRight size={16} /></button><button title="Delete record" onClick={() => onDelete(r.id)}><Trash2 size={15} /></button></div></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}

function RecordDetails({ record, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="panel-heading"><div><span className="eyebrow">RECORD DETAILS</span><h2>{record.id}</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
        <p className="subtext">{dateLabel(record.createdAt)}</p>
        <div className="detail-result"><span>Model output</span><strong>Class {record.prediction}</strong><span>Class 1 probability</span><strong>{(record.probability * 100).toFixed(1)}%</strong></div>
        <div className="detail-grid">{fields.map((f) => <div key={f.name}><span>{f.label}</span><strong>{record.inputs[f.name]} <small>{f.unit}</small></strong></div>)}</div>
        <p className="disclaimer">Educational output only. This record is not a medical diagnosis.</p>
      </section>
    </div>
  );
}

export default App;

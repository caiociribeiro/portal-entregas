"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, X, CarFront, MapPin, CheckCircle2, CircleAlert } from "lucide-react";

type CatalogItem = { id: string; category: string; name: string; version?: string; active: boolean };
type StockVehicle = {
  id: string;
  modelId: string;
  color: string;
  chassis: string;
  inStore: boolean;
  location: string;
  notes: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const STOCK_KEY = "portal-entregas-stock";
const CATALOG_KEY = "portal-entregas-catalog";
const locations = ["Loja de origem", "Outra loja", "Em trânsito", "Preparação externa", "Pátio externo", "Outra localização"];
const emptyForm = { modelId: "", color: "", chassis: "", inStore: true, location: "Loja de origem", notes: "" };

export default function StockPage() {
  const [vehicles, setVehicles] = useState<StockVehicle[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setVehicles(JSON.parse(localStorage.getItem(STOCK_KEY) ?? "[]"));
      setCatalog(JSON.parse(localStorage.getItem(CATALOG_KEY) ?? "[]"));
    } catch { setVehicles([]); setCatalog([]); }
    finally { setLoaded(true); }
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STOCK_KEY, JSON.stringify(vehicles));
  }, [vehicles, loaded]);

  const models = catalog.filter((item) => item.category === "vehicles" && item.active);
  const visible = useMemo(() => vehicles.filter((vehicle) => {
    const model = catalog.find((item) => item.id === vehicle.modelId);
    const text = [model?.name, model?.version, vehicle.color, vehicle.chassis, vehicle.location].join(" ").toLowerCase();
    return text.includes(search.toLowerCase()) && (filter === "all" || (filter === "in" ? vehicle.inStore : !vehicle.inStore));
  }), [vehicles, catalog, search, filter]);

  function modelName(id: string) {
    const model = catalog.find((item) => item.id === id);
    return model ? `${model.name}${model.version ? ` ${model.version}` : ""}` : "Modelo não encontrado";
  }
  function openNew() { setEditingId(null); setForm(emptyForm); setError(""); setModalOpen(true); }
  function openEdit(vehicle: StockVehicle) {
    setEditingId(vehicle.id);
    setForm({ modelId: vehicle.modelId, color: vehicle.color, chassis: vehicle.chassis, inStore: vehicle.inStore, location: vehicle.location, notes: vehicle.notes });
    setError(""); setModalOpen(true);
  }
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chassis = form.chassis.trim().toUpperCase();
    if (!form.modelId || !form.color.trim() || !chassis) { setError("Informe modelo, cor e chassi."); return; }
    if (vehicles.some((v) => v.chassis.toUpperCase() === chassis && v.id !== editingId)) { setError("Já existe um veículo cadastrado com este chassi."); return; }
    const now = new Date().toISOString();
    if (editingId) setVehicles((current) => current.map((v) => v.id === editingId ? { ...v, ...form, chassis, color: form.color.trim(), notes: form.notes.trim(), updatedAt: now } : v));
    else setVehicles((current) => [...current, { id: crypto.randomUUID(), ...form, chassis, color: form.color.trim(), notes: form.notes.trim(), active: true, createdAt: now, updatedAt: now }]);
    setModalOpen(false); setEditingId(null); setForm(emptyForm);
  }
  function toggleStore(vehicle: StockVehicle) {
    setVehicles((current) => current.map((v) => v.id === vehicle.id ? { ...v, inStore: !v.inStore, updatedAt: new Date().toISOString() } : v));
  }

  if (!loaded) return <div className="p-8 text-sm text-gray-500">Carregando estoque...</div>;
  return <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8 lg:py-9">
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="mb-1 text-xs text-gray-500">Gerenciamento / Estoque</p><h1 className="text-2xl font-semibold text-gray-900">Estoque de veículos</h1><p className="mt-1 text-sm text-gray-500">Cadastre os veículos e acompanhe sua presença e localização.</p></div>
      <button onClick={openNew} className="flex items-center justify-center gap-2 rounded-md bg-[#151515] px-4 py-2.5 text-sm font-medium text-white"><Plus size={17}/> Cadastrar veículo</button>
    </div>
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Veículos cadastrados</p><p className="mt-1 text-2xl font-semibold">{vehicles.length}</p></div>
      <div className="rounded-lg border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Na loja</p><p className="mt-1 text-2xl font-semibold text-green-700">{vehicles.filter(v=>v.inStore).length}</p></div>
      <div className="rounded-lg border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Fora da loja</p><p className="mt-1 text-2xl font-semibold text-amber-700">{vehicles.filter(v=>!v.inStore).length}</p></div>
    </div>
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row">
      <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por modelo, versão, cor ou chassi" className="h-10 w-full rounded-md border border-gray-200 pl-9 pr-3 text-sm"/></div>
      <select value={filter} onChange={e=>setFilter(e.target.value)} className="h-10 rounded-md border border-gray-200 px-3 text-sm"><option value="all">Todos os veículos</option><option value="in">Na loja</option><option value="out">Fora da loja</option></select>
    </div>
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {visible.length === 0 ? <div className="p-10 text-center text-sm text-gray-500">Nenhum veículo encontrado. Cadastre o primeiro veículo para começar.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Veículo</th><th className="px-5 py-3">Cor</th><th className="px-5 py-3">Chassi</th><th className="px-5 py-3">Localização</th><th className="px-5 py-3">Situação</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-gray-100">{visible.map(v=><tr key={v.id}><td className="px-5 py-4"><div className="flex items-center gap-2"><CarFront size={17} className="text-gray-400"/><span className="text-sm font-medium">{modelName(v.modelId)}</span></div></td><td className="px-5 py-4 text-sm text-gray-600">{v.color}</td><td className="px-5 py-4 font-mono text-sm text-gray-600">••••••{v.chassis.slice(-6)}</td><td className="px-5 py-4 text-sm text-gray-600"><span className="flex items-center gap-1"><MapPin size={14}/>{v.location}</span></td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${v.inStore ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{v.inStore ? <CheckCircle2 size={13}/> : <CircleAlert size={13}/>} {v.inStore ? "Na loja" : "Fora da loja"}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={()=>toggleStore(v)} className="rounded border border-gray-200 px-2.5 py-1.5 text-xs hover:bg-gray-50">Marcar {v.inStore ? "fora" : "na loja"}</button><button onClick={()=>openEdit(v)} className="rounded p-2 text-gray-500 hover:bg-gray-100" aria-label="Editar"><Pencil size={15}/></button></div></td></tr>)}</tbody></table></div>}
    </div>
    {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={save} className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">{editingId ? "Editar veículo" : "Cadastrar veículo"}</h2><button type="button" onClick={()=>setModalOpen(false)}><X size={20}/></button></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-medium text-gray-600">Modelo e versão *</span><select required value={form.modelId} onChange={e=>setForm({...form,modelId:e.target.value})} className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm"><option value="">Selecione o modelo</option>{models.map(m=><option key={m.id} value={m.id}>{m.name}{m.version ? ` ${m.version}` : ""}</option>)}</select>{models.length===0 && <span className="mt-1 block text-xs text-amber-700">Cadastre primeiro os modelos no Catálogo.</span>}</label>
      <label><span className="mb-1.5 block text-xs font-medium text-gray-600">Cor *</span><input required value={form.color} onChange={e=>setForm({...form,color:e.target.value})} className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm" placeholder="Cor do veículo"/></label>
      <label><span className="mb-1.5 block text-xs font-medium text-gray-600">Chassi *</span><input required maxLength={17} value={form.chassis} onChange={e=>setForm({...form,chassis:e.target.value.toUpperCase()})} className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm uppercase" placeholder="Chassi completo"/></label>
      <label><span className="mb-1.5 block text-xs font-medium text-gray-600">Localização atual</span><select value={form.location} onChange={e=>setForm({...form,location:e.target.value,inStore:e.target.value==="Loja de origem"})} className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm">{locations.map(l=><option key={l}>{l}</option>)}</select></label>
      <label className="flex items-center gap-2 pt-6 text-sm"><input type="checkbox" checked={form.inStore} onChange={e=>setForm({...form,inStore:e.target.checked,location:e.target.checked?"Loja de origem":(form.location==="Loja de origem"?"Outra localização":form.location)})}/> Veículo está na loja</label>
      <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-medium text-gray-600">Observações</span><textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full rounded-md border border-gray-200 p-3 text-sm"/></label></div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>setModalOpen(false)} className="rounded-md border border-gray-200 px-4 py-2 text-sm">Cancelar</button><button type="submit" className="rounded-md bg-[#151515] px-4 py-2 text-sm text-white">Salvar veículo</button></div>
    </form></div>}
  </div>;
}

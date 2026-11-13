"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckSquare, Printer, Search } from "lucide-react";

type Delivery = {
  id: string;
  date: string;
  time: string;
  customer: string;
  modelId: string;
  color: string;
  chassis: string;
  salesConsultantId: string;
  status: string;
};

type CatalogItem = { id: string; name: string; manufacturer?: string; version?: string };
type User = { id: string; name: string };

const APPOINTMENTS_KEY = "portal-entregas-appointments";
const CATALOG_KEY = "portal-entregas-catalog";
const USERS_KEY = "portal-entregas-users";

function todayAsInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export default function WashingPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [date, setDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      setDeliveries(JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) ?? "[]"));
      setCatalog(JSON.parse(localStorage.getItem(CATALOG_KEY) ?? "[]"));
      setUsers(JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]"));
    } catch {
      setDeliveries([]);
      setCatalog([]);
      setUsers([]);
    } finally {
      setDate(todayAsInput());
      setLoaded(true);
    }
  }, []);

  const dayDeliveries = useMemo(() => {
    return deliveries
      .filter((delivery) => delivery.date === date && !["CANCELADO", "ENTREGUE"].includes(delivery.status))
      .filter((delivery) => {
        const model = catalog.find((item) => item.id === delivery.modelId);
        const consultant = users.find((user) => user.id === delivery.salesConsultantId);
        return [delivery.customer, model?.name, delivery.chassis, delivery.color, consultant?.name]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [deliveries, catalog, users, date, search]);

  const selectedDeliveries = dayDeliveries.filter((delivery) => selectedIds.includes(delivery.id));

  function getModelName(modelId: string) {
    const model = catalog.find((item) => item.id === modelId);
    return model?.name ?? "Modelo não informado";
  }

  function getConsultantName(userId: string) {
    return users.find((user) => user.id === userId)?.name ?? "Não informado";
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAll() {
    const visibleIds = dayDeliveries.map((delivery) => delivery.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => allSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])]);
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8 lg:py-9">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs text-gray-500">Operação / Lavagem</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Relatório de lavagens</h1>
          <p className="mt-1 text-sm text-gray-500">Selecione as entregas e imprima a relação de veículos para a equipe responsável pela lavagem.</p>
        </div>
        <button
          onClick={() => window.print()}
          disabled={selectedDeliveries.length === 0}
          className="no-print flex items-center justify-center gap-2 rounded-md bg-[#151515] px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Printer size={17} />
          Imprimir relatório ({selectedDeliveries.length})
        </button>
      </div>

      <section className="no-print mb-5 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Data das entregas</label>
            <input type="date" value={date} onChange={(event) => { setDate(event.target.value); setSelectedIds([]); }} className="h-10 rounded-md border border-gray-200 px-3 text-sm" />
          </div>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar veículo, chassi ou consultor..." className="h-10 w-full rounded-md border border-gray-200 pl-9 pr-3 text-sm" />
          </div>
          <button onClick={toggleAll} disabled={dayDeliveries.length === 0} className="flex h-10 items-center justify-center gap-2 rounded-md border border-gray-200 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40">
            <CheckSquare size={15} />
            {dayDeliveries.length > 0 && dayDeliveries.every((item) => selectedIds.includes(item.id)) ? "Desmarcar todos" : "Selecionar todos"}
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-500">{dayDeliveries.length} entrega(s) disponível(is) · {selectedIds.length} selecionada(s)</p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {!loaded ? (
          <p className="p-10 text-center text-sm text-gray-500">Carregando entregas...</p>
        ) : dayDeliveries.length === 0 ? (
          <p className="p-10 text-center text-sm text-gray-500">Não há entregas ativas para a data selecionada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="no-print w-12 px-5 py-3"><span className="sr-only">Selecionar</span></th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Horário</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Modelo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Chassi</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Cor</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Consultor de vendas</th>
                </tr>
              </thead>
              <tbody>
                {dayDeliveries.map((delivery) => (
                  <tr key={delivery.id} className={`border-t border-gray-100 ${selectedIds.includes(delivery.id) ? "bg-gray-50" : ""}`}>
                    <td className="no-print px-5 py-3">
                      <input type="checkbox" checked={selectedIds.includes(delivery.id)} onChange={() => toggleSelection(delivery.id)} aria-label={`Selecionar entrega de ${delivery.customer}`} className="h-4 w-4 accent-black" />
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold tabular-nums text-gray-900">{delivery.time}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{getModelName(delivery.modelId)}</td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-700">{delivery.chassis ? `••••••${delivery.chassis.slice(-6)}` : "Não informado"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{delivery.color || "Não informada"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{getConsultantName(delivery.salesConsultantId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="print-only">
        <div className="mb-6 border-b border-black pb-4">
          <h1 className="text-xl font-bold">RELATÓRIO DE LAVAGENS</h1>
          <p className="mt-1 text-sm">Data das entregas: {formatDate(date)}</p>
          <p className="text-sm">Veículos selecionados: {selectedDeliveries.length}</p>
        </div>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="border border-black p-2 text-sm">Horário</th>
              <th className="border border-black p-2 text-sm">Modelo</th>
              <th className="border border-black p-2 text-sm">Chassi</th>
              <th className="border border-black p-2 text-sm">Cor</th>
              <th className="border border-black p-2 text-sm">Consultor de vendas</th>
            </tr>
          </thead>
          <tbody>
            {selectedDeliveries.map((delivery) => (
              <tr key={delivery.id}>
                <td className="border border-black p-2 text-sm">{delivery.time}</td>
                <td className="border border-black p-2 text-sm">{getModelName(delivery.modelId)}</td>
                <td className="border border-black p-2 text-sm">{delivery.chassis ? `••••••${delivery.chassis.slice(-6)}` : "Não informado"}</td>
                <td className="border border-black p-2 text-sm">{delivery.color || "Não informada"}</td>
                <td className="border border-black p-2 text-sm">{getConsultantName(delivery.salesConsultantId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <style jsx global>{`
        .print-only { display: none; }
        @media print {
          @page { margin: 15mm; }
          body { background: white !important; }
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; }
          .print-only { display: block !important; position: absolute; inset: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

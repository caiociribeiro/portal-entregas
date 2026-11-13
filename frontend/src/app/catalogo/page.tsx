'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Package,
  CarFront,
  Sparkles,
  CheckCircle2,
  CircleSlash,
  ChevronDown,
} from 'lucide-react';

type Category = 'vehicles' | 'accessories' | 'services';

interface CatalogItem {
  id: string;
  category: Category;
  name: string;
  manufacturer?: string;
  version?: string;
  description: string;
  active: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'portal-entregas-catalog';

const categories = [
  { id: 'vehicles', label: 'Modelos de veículos', icon: CarFront },
  { id: 'accessories', label: 'Acessórios', icon: Package },
  { id: 'services', label: 'Serviços de estética', icon: Sparkles },
] as const;

const emptyForm = {
  name: '',
  manufacturer: '',
  version: '',
  description: '',
};

export default function CatalogPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('vehicles');

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      console.error('Não foi possível carregar o catálogo.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = item.category === activeCategory;

      const searchText = [
        item.name,
        item.manufacturer ?? '',
        item.version ?? '',
        item.description,
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.active) ||
        (statusFilter === 'inactive' && !item.active);

      return matchesCategory && matchesSearch && matchesStatus;
    });
  }, [items, activeCategory, search, statusFilter]);

  const activeCount = items.filter(
    (item) => item.category === activeCategory && item.active,
  ).length;

  const inactiveCount = items.filter(
    (item) => item.category === activeCategory && !item.active,
  ).length;

  function openNewModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(item: CatalogItem) {
    setEditingId(item.id);

    setForm({
      name: item.name,
      manufacturer: item.manufacturer ?? '',
      version: item.version ?? '',
      description: item.description,
    });

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) return;

    if (activeCategory === 'vehicles' && !form.manufacturer.trim()) {
      return;
    }

    if (editingId) {
      setItems((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name,
                manufacturer:
                  activeCategory === 'vehicles'
                    ? form.manufacturer.trim()
                    : undefined,
                version:
                  activeCategory === 'vehicles'
                    ? form.version.trim()
                    : undefined,
                description: form.description.trim(),
              }
            : item,
        ),
      );
    } else {
      const newItem: CatalogItem = {
        id: crypto.randomUUID(),
        category: activeCategory,
        name,
        manufacturer:
          activeCategory === 'vehicles' ? form.manufacturer.trim() : undefined,
        version:
          activeCategory === 'vehicles' ? form.version.trim() : undefined,
        description: form.description.trim(),
        active: true,
        createdAt: new Date().toISOString(),
      };

      setItems((current) => [...current, newItem]);
    }

    closeModal();
  }

  function toggleStatus(item: CatalogItem) {
    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? { ...currentItem, active: !currentItem.active }
          : currentItem,
      ),
    );
  }

  function deleteItem(item: CatalogItem) {
    const confirmed = window.confirm(
      `Deseja realmente excluir "${item.name}"?`,
    );

    if (!confirmed) return;

    setItems((current) =>
      current.filter((currentItem) => currentItem.id !== item.id),
    );
  }

  const currentCategory = categories.find(
    (category) => category.id === activeCategory,
  );

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-7 lg:px-8 lg:py-9">
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-xs text-gray-500">Gerenciamento / Catálogo</p>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Catálogo
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Gerencie os modelos de veículos, acessórios e serviços disponíveis.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center justify-center gap-2 rounded-md bg-[#151515] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={17} />
          Novo cadastro
        </button>
      </div>

      {/* Indicadores */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total de cadastros</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {items.filter((item) => item.category === activeCategory).length}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Ativos</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {activeCount}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Inativos</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {inactiveCount}
          </p>
        </div>
      </section>

      {/* Categorias */}
      <section className="mb-5 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row">
          {categories.map((category) => {
            const Icon = category.icon;
            const selected = activeCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setSearch('');
                  setStatusFilter('all');
                }}
                className={`flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm transition sm:flex-1 ${
                  selected
                    ? 'bg-[#151515] font-medium text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={17} />
                {category.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Lista */}
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-semibold text-gray-900">
              {currentCategory?.label}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {filteredItems.length} registro(s) encontrado(s)
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cadastro..."
                className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-gray-500 sm:w-[230px]"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 w-full appearance-none rounded-md border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-600 outline-none focus:border-gray-500 sm:w-[150px]"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
        </div>

        {!loaded ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Carregando catálogo...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-12 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              {currentCategory && (
                <currentCategory.icon size={27} className="text-gray-400" />
              )}
            </div>

            <h3 className="text-sm font-medium text-gray-800">
              {search || statusFilter !== 'all'
                ? 'Nenhum resultado encontrado'
                : 'Nenhum cadastro realizado'}
            </h3>

            <p className="mt-2 max-w-sm text-xs leading-5 text-gray-400">
              {search || statusFilter !== 'all'
                ? 'Tente alterar os filtros ou o termo pesquisado.'
                : 'Adicione o primeiro registro desta categoria para começar a utilizar o catálogo.'}
            </p>

            {!search && statusFilter === 'all' && (
              <button
                onClick={openNewModal}
                className="mt-5 flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus size={15} />
                Novo cadastro
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500">
                    Nome
                  </th>

                  {activeCategory === 'vehicles' && (
                    <>
                      <th className="px-5 py-4 text-xs font-semibold text-gray-500">
                        Fabricante
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold text-gray-500">
                        Versão
                      </th>
                    </>
                  )}

                  <th className="px-5 py-4 text-xs font-semibold text-gray-500">
                    Descrição
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-800">
                        {item.name}
                      </p>
                    </td>

                    {activeCategory === 'vehicles' && (
                      <>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {item.manufacturer || '—'}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {item.version || '—'}
                        </td>
                      </>
                    )}

                    <td className="max-w-[250px] px-5 py-4 text-sm text-gray-500">
                      <span className="line-clamp-2">
                        {item.description || '—'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.active ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <CircleSlash size={13} />
                        )}
                        {item.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          title="Editar"
                          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-black"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => toggleStatus(item)}
                          title={item.active ? 'Desativar' : 'Ativar'}
                          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-black"
                        >
                          {item.active ? (
                            <CircleSlash size={16} />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                        </button>

                        <button
                          onClick={() => deleteItem(item)}
                          title="Excluir"
                          className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de cadastro */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-[520px] rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="font-semibold text-gray-900">
                  {editingId ? 'Editar cadastro' : 'Novo cadastro'}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {currentCategory?.label}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 px-6 py-6">
                {activeCategory === 'vehicles' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Fabricante *
                    </label>

                    <input
                      required
                      value={form.manufacturer}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          manufacturer: event.target.value,
                        })
                      }
                      placeholder="Ex.: Toyota"
                      className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-500"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {activeCategory === 'vehicles' ? 'Modelo *' : 'Nome *'}
                  </label>

                  <input
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder={
                      activeCategory === 'vehicles'
                        ? 'Ex.: Corolla Cross'
                        : activeCategory === 'accessories'
                          ? 'Nome do acessório'
                          : 'Nome do serviço'
                    }
                    className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-500"
                  />
                </div>

                {activeCategory === 'vehicles' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Versão
                    </label>

                    <input
                      value={form.version}
                      onChange={(event) =>
                        setForm({ ...form, version: event.target.value })
                      }
                      placeholder="Ex.: XRX Hybrid"
                      className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-500"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Descrição
                  </label>

                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    placeholder="Informações adicionais (opcional)"
                    className="w-full resize-none rounded-md border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-md bg-[#151515] px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  {editingId ? 'Salvar alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Users,
  CheckCircle2,
  CircleSlash,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

const STORAGE_KEY = 'portal-entregas-users';

const availableRoles = [
  'Administrador',
  'Gestor',
  'Entregador(a)',
  'Preparador(a)',
  'Consultor(a) de Vendas',
  'Consultor(a) de Estética',
];

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  active: boolean;
  createdAt: string;
}

const emptyForm = {
  name: '',
  email: '',
  roles: [] as string[],
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        setUsers(JSON.parse(stored));
      }
    } catch {
      console.error('Não foi possível carregar os usuários.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users, loaded]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchText = [user.name, user.email, ...user.roles]
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.active) ||
        (statusFilter === 'inactive' && !user.active);

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const activeCount = users.filter((user) => user.active).length;
  const inactiveCount = users.filter((user) => !user.active).length;

  function openNewModal() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      roles: [...user.roles],
    });
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  function toggleRole(role: string) {
    setForm((current) => ({
      ...current,
      roles: current.roles.includes(role)
        ? current.roles.filter((item) => item !== role)
        : [...current.roles, role],
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email || form.roles.length === 0) {
      setError(
        'Preencha os campos obrigatórios e selecione pelo menos um perfil.',
      );
      return;
    }

    const emailExists = users.some(
      (user) => user.email.toLowerCase() === email && user.id !== editingId,
    );

    if (emailExists) {
      setError('Já existe um usuário cadastrado com este e-mail.');
      return;
    }

    if (editingId) {
      setUsers((current) =>
        current.map((user) =>
          user.id === editingId
            ? { ...user, name, email, roles: form.roles }
            : user,
        ),
      );
    } else {
      const newUser: User = {
        id: crypto.randomUUID(),
        name,
        email,
        roles: form.roles,
        active: true,
        createdAt: new Date().toISOString(),
      };

      setUsers((current) => [...current, newUser]);
    }

    closeModal();
  }

  function toggleStatus(user: User) {
    setUsers((current) =>
      current.map((item) =>
        item.id === user.id ? { ...item, active: !item.active } : item,
      ),
    );
  }

  function deleteUser(user: User) {
    const confirmed = window.confirm(
      `Deseja realmente excluir o usuário "${user.name}"?`,
    );

    if (!confirmed) return;

    setUsers((current) => current.filter((item) => item.id !== user.id));
  }

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-7 lg:px-8 lg:py-9">
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-xs text-gray-500">Gerenciamento / Usuários</p>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Usuários
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Gerencie os usuários e seus perfis de acesso ao sistema.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center justify-center gap-2 rounded-md bg-[#151515] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={17} />
          Novo usuário
        </button>
      </div>

      {/* Indicadores */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total de usuários</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {users.length}
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

      {/* Perfis disponíveis */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={18} className="text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-800">
            Perfis disponíveis
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableRoles.map((role) => (
            <span
              key={role}
              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600"
            >
              {role}
            </span>
          ))}
        </div>
      </section>

      {/* Lista */}
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-semibold text-gray-900">
              Usuários cadastrados
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {filteredUsers.length} registro(s) encontrado(s)
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
                placeholder="Buscar usuário..."
                className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-gray-500 sm:w-[230px]"
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
            Carregando usuários...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-12 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <Users size={27} className="text-gray-400" />
            </div>

            <h3 className="text-sm font-medium text-gray-800">
              {search || statusFilter !== 'all'
                ? 'Nenhum usuário encontrado'
                : 'Nenhum usuário cadastrado'}
            </h3>

            <p className="mt-2 max-w-sm text-xs leading-5 text-gray-400">
              {search || statusFilter !== 'all'
                ? 'Tente alterar os filtros ou o termo pesquisado.'
                : 'Cadastre os usuários que participarão da operação.'}
            </p>

            {!search && statusFilter === 'all' && (
              <button
                onClick={openNewModal}
                className="mt-5 flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus size={15} />
                Novo usuário
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500">
                    Nome
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500">
                    E-mail
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500">
                    Perfis de acesso
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
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {user.name
                            .split(' ')
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join('')
                            .toUpperCase()}
                        </div>

                        <span className="text-sm font-medium text-gray-800">
                          {user.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex max-w-[320px] flex-wrap gap-1.5">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-600"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          user.active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {user.active ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <CircleSlash size={13} />
                        )}
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(user)}
                          title="Editar"
                          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-black"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => toggleStatus(user)}
                          title={user.active ? 'Desativar' : 'Ativar'}
                          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-black"
                        >
                          {user.active ? (
                            <CircleSlash size={16} />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                        </button>

                        <button
                          onClick={() => deleteUser(user)}
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

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="font-semibold text-gray-900">
                  {editingId ? 'Editar usuário' : 'Novo usuário'}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Informe os dados e os perfis de acesso.
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
              <div className="space-y-5 px-6 py-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Nome completo *
                  </label>

                  <input
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="Nome do usuário"
                    className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    E-mail *
                  </label>

                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                    placeholder="usuario@empresa.com"
                    className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-500"
                  />
                </div>

                <div>
                  <div className="mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Perfis de acesso *
                    </label>
                    <p className="mt-1 text-xs text-gray-400">
                      Selecione um ou mais perfis para este usuário.
                    </p>
                  </div>

                  <div className="space-y-2 rounded-md border border-gray-200 p-3">
                    {availableRoles.map((role) => (
                      <label
                        key={role}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={form.roles.includes(role)}
                          onChange={() => toggleRole(role)}
                          className="h-4 w-4 accent-black"
                        />

                        <span className="text-sm text-gray-700">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </p>
                )}
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
                  {editingId ? 'Salvar alterações' : 'Cadastrar usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CarFront,
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock3,
  Search,
  Pencil,
  X,
  MapPin,
  UserRound,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  FileText,
  Hash,
  Droplets,
  Wrench,
  Palette,
  BadgeCheck,
} from 'lucide-react';

type DeliveryStatus =
  | 'PRE_AGENDAMENTO'
  | 'CONFIRMADO'
  | 'ENTREGUE'
  | 'CANCELADO';

interface CatalogItem {
  id: string;
  category: 'vehicles' | 'accessories' | 'services';
  name: string;
  manufacturer?: string;
  version?: string;
  description: string;
  active: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  active: boolean;
}

interface DeliveryItem {
  id: string;
  name: string;
  category: 'accessories' | 'services' | 'custom';
  courtesy: boolean;
  applied: boolean;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  customer: string;
  modelId: string;
  year: string;
  color: string;
  chassis: string;
  orderNumber: string;
  status: DeliveryStatus;
  location: string;
  inStore: boolean;
  locationNotes: string;
  passStatus: string;
  platingType: string;
  plated: boolean;
  washed: boolean;
  reviewed: boolean;
  salesConsultantId: string;
  aestheticsConsultantId: string;
  responsibleId: string;
  items: DeliveryItem[];
  notes: string;
  createdAt: string;
}

const STORAGE_KEY = 'portal-entregas-appointments';
const CATALOG_KEY = 'portal-entregas-catalog';
const USERS_KEY = 'portal-entregas-users';

const statuses: {
  value: DeliveryStatus;
  label: string;
  className: string;
}[] = [
  {
    value: 'PRE_AGENDAMENTO',
    label: 'Pré-agendamento',
    className: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  {
    value: 'CONFIRMADO',
    label: 'Confirmado',
    className: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  {
    value: 'ENTREGUE',
    label: 'Entregue',
    className: 'bg-green-100 text-green-800 border border-green-200',
  },
  {
    value: 'CANCELADO',
    label: 'Cancelado',
    className: 'bg-red-100 text-red-800 border border-red-200',
  },
];

const deliveryTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

const locations = [
  'Na loja de origem',
  'Em trânsito',
  'Em outra loja',
  'Em preparação externa',
  'Aguardando chegada',
  'Outra localização',
];

const emptyForm = {
  date: '',
  time: '09:00',
  customer: '',
  modelId: '',
  year: '',
  color: '',
  chassis: '',
  orderNumber: '',
  status: 'PRE_AGENDAMENTO' as DeliveryStatus,
  location: 'Na loja de origem',
  inStore: true,
  locationNotes: '',
  passStatus: 'PENDENTE',
  platingType: 'INTERNO',
  plated: false,
  washed: false,
  reviewed: false,
  salesConsultantId: '',
  aestheticsConsultantId: '',
  responsibleId: '',
  items: [] as DeliveryItem[],
  newItemId: '',
  newItemCourtesy: false,
  notes: '',
};

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatLongDate(value: string) {
  return parseDate(value).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function getStatusLabel(status: DeliveryStatus) {
  return statuses.find((item) => item.value === status)?.label ?? status;
}

function getStatusClass(status: DeliveryStatus) {
  return (
    statuses.find((item) => item.value === status)?.className ??
    'bg-gray-100 text-gray-600'
  );
}

function catalogItemNameFromStorage(storedCatalog: string | null, id: string) {
  if (!storedCatalog) return 'Item do catálogo';
  try {
    const items = JSON.parse(storedCatalog) as CatalogItem[];
    return items.find((item) => item.id === id)?.name ?? 'Item do catálogo';
  } catch {
    return 'Item do catálogo';
  }
}

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const storedAppointments = localStorage.getItem(STORAGE_KEY);
      const storedCatalog = localStorage.getItem(CATALOG_KEY);
      const storedUsers = localStorage.getItem(USERS_KEY);

      if (storedAppointments) {
        const parsedAppointments = JSON.parse(storedAppointments) as (Appointment & {
          accessoryIds?: string[];
          serviceIds?: string[];
          courtesy?: string;
          items?: DeliveryItem[];
        })[];
        setAppointments(
          parsedAppointments.map((appointment) => ({
            ...appointment,
            inStore: appointment.inStore ?? appointment.location === 'Na loja de origem',
            locationNotes: appointment.locationNotes ?? '',
            items: appointment.items ?? [
              ...(appointment.accessoryIds ?? []).map((id) => ({
                id: `legacy-${id}`,
                name: catalogItemNameFromStorage(storedCatalog, id),
                category: 'accessories' as const,
                courtesy: false,
                applied: false,
              })),
              ...(appointment.serviceIds ?? []).map((id) => ({
                id: `legacy-${id}`,
                name: catalogItemNameFromStorage(storedCatalog, id),
                category: 'services' as const,
                courtesy: false,
                applied: false,
              })),
              ...(appointment.courtesy?.trim()
                ? [{
                    id: `legacy-courtesy-${appointment.id}`,
                    name: appointment.courtesy.trim(),
                    category: 'custom' as const,
                    courtesy: true,
                    applied: false,
                  }]
                : []),
            ],
          })),
        );
      }

      if (storedCatalog) {
        setCatalog(JSON.parse(storedCatalog));
      }

      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }
    } catch {
      console.error('Não foi possível carregar os dados.');
    } finally {
      setSelectedDate(formatDate(new Date()));
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  }, [appointments, loaded]);

  const vehicles = catalog.filter(
    (item) => item.category === 'vehicles' && item.active,
  );

  const accessories = catalog.filter(
    (item) => item.category === 'accessories' && item.active,
  );

  const services = catalog.filter(
    (item) => item.category === 'services' && item.active,
  );

  const salesConsultants = users.filter(
    (user) => user.active && user.roles.includes('Consultor(a) de Vendas'),
  );

  const aestheticsConsultants = users.filter(
    (user) => user.active && user.roles.includes('Consultor(a) de Estética'),
  );

  const responsibleUsers = users.filter(
    (user) =>
      user.active &&
      (user.roles.includes('Entregador(a)') ||
        user.roles.includes('Preparador(a)') ||
        user.roles.includes('Gestor') ||
        user.roles.includes('Administrador')),
  );

  const dayAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        const matchesDate = appointment.date === selectedDate;

        const model = catalog.find((item) => item.id === appointment.modelId);

        const searchText = [
          appointment.customer,
          appointment.orderNumber,
          appointment.chassis,
          model?.name ?? '',
        ]
          .join(' ')
          .toLowerCase();

        const matchesSearch = searchText.includes(search.toLowerCase());

        const matchesStatus =
          statusFilter === 'all' || appointment.status === statusFilter;

        return matchesDate && matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate, search, statusFilter, catalog]);

  const dayStats = appointments.filter(
    (appointment) => appointment.date === selectedDate,
  );

  function changeDate(days: number) {
    const date = parseDate(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(formatDate(date));
  }

  function openNewModal() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      date: selectedDate,
    });
    setError('');
    setModalOpen(true);
  }

  function openEditModal(appointment: Appointment) {
    if (
      appointment.status === 'ENTREGUE' ||
      appointment.status === 'CANCELADO'
    ) {
      return;
    }

    setEditingId(appointment.id);

    setForm({
      date: appointment.date,
      time: appointment.time,
      customer: appointment.customer,
      modelId: appointment.modelId,
      year: appointment.year ?? '',
      color: appointment.color,
      chassis: appointment.chassis,
      orderNumber: appointment.orderNumber,
      status: appointment.status,
      location: appointment.location,
      inStore: appointment.inStore ?? appointment.location === 'Na loja de origem',
      locationNotes: appointment.locationNotes ?? '',
      passStatus: appointment.passStatus,
      platingType: appointment.platingType,
      plated: appointment.plated,
      washed: appointment.washed,
      reviewed: appointment.reviewed,
      salesConsultantId: appointment.salesConsultantId,
      aestheticsConsultantId: appointment.aestheticsConsultantId,
      responsibleId: appointment.responsibleId,
      items: [...(appointment.items ?? [])],
      newItemId: '',
      newItemCourtesy: false,
      notes: appointment.notes,
    });

    setError('');
    setDetailsOpen(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  function addDeliveryItem() {
    if (!form.newItemId) return;
    const catalogItem = catalog.find((item) => item.id === form.newItemId);
    if (!catalogItem) return;

    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: crypto.randomUUID(),
          name: catalogItem.name,
          category: catalogItem.category as 'accessories' | 'services',
          courtesy: current.newItemCourtesy,
          applied: false,
        },
      ],
      newItemId: '',
      newItemCourtesy: false,
    }));
  }

  function addCustomItem() {
    const name = window.prompt('Descreva o acessório ou serviço:')?.trim();
    if (!name) return;
    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: crypto.randomUUID(),
          name,
          category: 'custom',
          courtesy: current.newItemCourtesy,
          applied: false,
        },
      ],
      newItemCourtesy: false,
    }));
  }

  function updateDeliveryItem(id: string, changes: Partial<DeliveryItem>) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? { ...item, ...changes } : item,
      ),
    }));
  }

  function removeDeliveryItem(id: string) {
    setForm((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== id),
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.date || !form.time || !form.customer.trim() || !form.modelId || !form.color.trim() || !form.chassis.trim()) {
      setError('Preencha cliente, modelo, cor, chassi, data e horário.');
      return;
    }

    if (!deliveryTimes.includes(form.time)) {
      setError('Selecione um dos horários disponíveis: 09h às 11h ou 14h às 17h.');
      return;
    }

    const occupiedSlot = appointments.find(
      (appointment) =>
        appointment.date === form.date &&
        appointment.time === form.time &&
        appointment.id !== editingId &&
        appointment.status !== 'CANCELADO',
    );
    if (occupiedSlot) {
      setError('Este horário já possui uma entrega agendada. Selecione outro horário.');
      return;
    }

    const existingVehicleAppointment = appointments.find(
      (appointment) =>
        appointment.chassis === form.chassis &&
        appointment.id !== editingId &&
        appointment.status !== 'ENTREGUE' &&
        appointment.status !== 'CANCELADO',
    );
    if (existingVehicleAppointment) {
      setError('Este veículo já possui uma entrega ativa cadastrada.');
      return;
    }

    const currentAppointment = appointments.find(
      (item) => item.id === editingId,
    );

    if (
      currentAppointment &&
      (currentAppointment.status === 'ENTREGUE' ||
        currentAppointment.status === 'CANCELADO')
    ) {
      setError('Não é possível editar uma entrega finalizada.');
      return;
    }

    if (editingId) {
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === editingId
            ? {
                ...appointment,
                ...form,
                        customer: form.customer.trim(),
                chassis: form.chassis.trim().toUpperCase(),
                orderNumber: form.orderNumber.trim(),
              }
            : appointment,
        ),
      );
    } else {
      const newAppointment: Appointment = {
        id: crypto.randomUUID(),
        ...form,
        customer: form.customer.trim(),
        chassis: form.chassis.trim().toUpperCase(),
        orderNumber: form.orderNumber.trim(),
        createdAt: new Date().toISOString(),
      };

      setAppointments((current) => [...current, newAppointment]);
    }

    closeModal();
  }

  function openDetails(appointment: Appointment) {
    setSelectedAppointment(appointment);
    setDetailsOpen(true);
  }

  function updateStatus(appointment: Appointment, status: DeliveryStatus) {
    setAppointments((current) =>
      current.map((item) =>
        item.id === appointment.id ? { ...item, status } : item,
      ),
    );

    setSelectedAppointment((current) =>
      current?.id === appointment.id ? { ...current, status } : current,
    );
  }

  function getUserName(id: string) {
    return users.find((user) => user.id === id)?.name ?? 'Não informado';
  }

  function getModelName(id: string) {
    const model = catalog.find((item) => item.id === id);

    if (!model) return 'Modelo não informado';

    return model.version ? `${model.name} ${model.version}` : model.name;
  }



  const today = selectedDate;

  if (!loaded || !selectedDate) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-gray-500">
        Carregando calendário...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-7 lg:px-8 lg:py-9">
      {/* Cabeçalho */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-xs text-gray-500">Principal / Calendário</p>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Calendário de entregas
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Acompanhe e organize a programação de entregas.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center justify-center gap-2 rounded-md bg-[#151515] px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus size={17} />
          Nova entrega
        </button>
      </div>

      {/* Data selecionada */}
      <section className="mb-5 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-1 text-xs text-gray-500">Visualização diária</p>

            <h2 className="text-lg font-semibold capitalize text-gray-900">
              {formatLongDate(selectedDate)}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => changeDate(-1)}
              className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
              title="Dia anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => setSelectedDate(today)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Hoje
            </button>

            <button
              onClick={() => changeDate(1)}
              className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
              title="Próximo dia"
            >
              <ChevronRight size={18} />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="h-10 rounded-md border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-gray-500"
            />
          </div>
        </div>
      </section>

      {/* Indicadores */}
      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Total de entregas',
            value: dayStats.length,
            icon: CalendarDays,
          },
          {
            label: 'Pré-agendamentos',
            value: dayStats.filter((item) => item.status === 'PRE_AGENDAMENTO')
              .length,
            icon: Clock3,
          },
          {
            label: 'Confirmadas',
            value: dayStats.filter((item) => item.status === 'CONFIRMADO')
              .length,
            icon: CheckCircle2,
          },
          {
            label: 'Concluídas',
            value: dayStats.filter((item) => item.status === 'ENTREGUE').length,
            icon: ClipboardList,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <stat.icon size={17} className="text-gray-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {/* Filtros */}
      <section className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por cliente, modelo, pedido ou chassi..."
            className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-gray-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-gray-500 sm:w-[190px]"
        >
          <option value="all">Todos os status</option>
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </section>

      {/* Lista de entregas */}
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">Entregas do dia</h2>
            <p className="mt-1 text-xs text-gray-500">
              {dayAppointments.length} entrega(s) encontrada(s)
            </p>
          </div>
        </div>

        {!loaded ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Carregando entregas...
          </div>
        ) : dayAppointments.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-12 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <CalendarDays size={28} className="text-gray-400" />
            </div>

            <h3 className="text-sm font-medium text-gray-800">
              Nenhuma entrega agendada
            </h3>

            <p className="mt-2 max-w-sm text-xs leading-5 text-gray-400">
              Não há entregas cadastradas para esta data ou os filtros não
              retornaram resultados.
            </p>

            <button
              onClick={openNewModal}
              className="mt-5 flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus size={15} />
              Cadastrar entrega
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {dayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex flex-col gap-4 px-5 py-5 transition hover:bg-gray-50/70 lg:flex-row lg:items-center"
              >
                <div className="flex shrink-0 items-center gap-3 lg:w-[110px]">
                  <Clock3 size={17} className="text-gray-400" />
                  <span className="text-lg font-semibold tabular-nums text-gray-900">
                    {appointment.time}
                  </span>
                </div>

                <button
                  onClick={() => openDetails(appointment)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {appointment.customer}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                        appointment.status,
                      )}`}
                    >
                      {getStatusLabel(appointment.status)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <CarFront size={14} className="text-gray-400" />
                      {getModelName(appointment.modelId)}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Palette size={14} className="text-gray-400" />
                      {appointment.color || 'Cor não informada'}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <FileText size={14} className="text-gray-400" />
                      Pedido: {appointment.orderNumber || 'Não informado'}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Hash size={14} className="text-gray-400" />
                      Chassi:{' '}
                      {appointment.chassis
                        ? `••••••${appointment.chassis.slice(-6)}`
                        : 'Não informado'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      {appointment.location}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <UserRound size={14} />
                      {getUserName(appointment.salesConsultantId)}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <UserRound size={14} />
                      {getUserName(appointment.responsibleId)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Preparação
                    </span>

                    <span
                      className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] ${
                        appointment.passStatus === 'OK'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      <BadgeCheck size={12} />
                      Passe
                    </span>

                    <span
                      className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] ${
                        appointment.plated
                          ? 'bg-green-50 text-green-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      <CheckCircle2 size={12} />
                      Emplacamento
                    </span>

                    <span
                      className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] ${
                        appointment.washed
                          ? 'bg-green-50 text-green-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      <Droplets size={12} />
                      Lavagem
                    </span>

                    <span
                      className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] ${
                        appointment.reviewed
                          ? 'bg-green-50 text-green-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      <Wrench size={12} />
                      Revisão
                    </span>

                    {(['accessories', 'services'] as const).map((category) => {
                      const categoryItems = (appointment.items ?? []).filter(
                        (item) => item.category === category,
                      );
                      const allApplied = categoryItems.length > 0 && categoryItems.every((item) => item.applied);
                      return (
                        <span
                          key={category}
                          className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] ${
                            categoryItems.length === 0 || allApplied
                              ? 'bg-green-50 text-green-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <CheckCircle2 size={12} />
                          {category === 'accessories' ? 'Acessórios' : 'Serviços'}: {categoryItems.length === 0 ? 'N/A' : allApplied ? 'OK' : 'Pendente'}
                        </span>
                      );
                    })}
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => openDetails(appointment)}
                    className="rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-white"
                  >
                    Detalhes
                  </button>

                  {appointment.status !== 'ENTREGUE' &&
                    appointment.status !== 'CANCELADO' && (
                      <button
                        onClick={() => openEditModal(appointment)}
                        className="rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-white hover:text-black"
                        title="Editar entrega"
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal de cadastro e edição */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="max-h-[92vh] w-full max-w-[850px] overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="font-semibold text-gray-900">
                  {editingId ? 'Editar entrega' : 'Nova entrega'}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Preencha as informações do agendamento.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-7 px-6 py-6">
                {/* Agendamento */}
                <section>
                  <h3 className="mb-4 text-sm font-semibold text-gray-900">
                    Agendamento
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Cliente *
                      </label>
                      <input
                        required
                        value={form.customer}
                        onChange={(event) =>
                          setForm({ ...form, customer: event.target.value })
                        }
                        placeholder="Nome do cliente"
                        className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Número do pedido
                      </label>
                      <input
                        value={form.orderNumber}
                        onChange={(event) =>
                          setForm({ ...form, orderNumber: event.target.value })
                        }
                        placeholder="Número do pedido"
                        className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Data *
                      </label>
                      <input
                        required
                        type="date"
                        value={form.date}
                        onChange={(event) =>
                          setForm({ ...form, date: event.target.value })
                        }
                        className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Horário *
                      </label>
                      <select
                        required
                        value={form.time}
                        onChange={(event) =>
                          setForm({ ...form, time: event.target.value })
                        }
                        className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-500"
                      >
                        {deliveryTimes.map((time) => {
                          const occupied = appointments.some(
                            (appointment) =>
                              appointment.date === form.date &&
                              appointment.time === time &&
                              appointment.id !== editingId &&
                              appointment.status !== 'CANCELADO',
                          );
                          return (
                            <option key={time} value={time} disabled={occupied}>
                              {time}{occupied ? ' — ocupado' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Status
                      </label>
                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            status: event.target.value as DeliveryStatus,
                          })
                        }
                        className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-500"
                      >
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                <div className="border-t border-gray-100" />

                {/* Veículo */}
                <section>
                  <h3 className="mb-4 text-sm font-semibold text-gray-900">
                    Veículo
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Modelo e versão *
                      </label>
                      <select
                        value={form.modelId}
                        onChange={(event) => setForm({ ...form, modelId: event.target.value })}
                        required
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-500"
                      >
                        <option value="">Selecione o modelo</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {getModelName(vehicle.id)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">Cor *</label>
                      <input
                        value={form.color}
                        onChange={(event) => setForm({ ...form, color: event.target.value })}
                        required
                        placeholder="Cor do veículo"
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">Chassi *</label>
                      <input
                        value={form.chassis}
                        onChange={(event) => setForm({ ...form, chassis: event.target.value.toUpperCase() })}
                        required
                        placeholder="Informe o chassi completo"
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm uppercase outline-none focus:border-gray-500"
                      />
                    </div>
                  </div>
                </section>

                <div className="border-t border-gray-100" />

                                {/* Responsáveis */}
                <section>
                  <h3 className="mb-4 text-sm font-semibold text-gray-900">
                    Consultores e responsáveis
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Consultor de vendas
                      </label>
                      <select
                        value={form.salesConsultantId}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            salesConsultantId: event.target.value,
                          })
                        }
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-500"
                      >
                        <option value="">Selecione</option>
                        {salesConsultants.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Consultor de estética
                      </label>
                      <select
                        value={form.aestheticsConsultantId}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            aestheticsConsultantId: event.target.value,
                          })
                        }
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-500"
                      >
                        <option value="">Não se aplica</option>
                        {aestheticsConsultants.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Responsável pela entrega
                      </label>
                      <select
                        value={form.responsibleId}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            responsibleId: event.target.value,
                          })
                        }
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-500"
                      >
                        <option value="">Selecione</option>
                        {responsibleUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                <div className="border-t border-gray-100" />

                {/* Localização */}
                <section>
                  <h3 className="mb-4 text-sm font-semibold text-gray-900">
                    Localização
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Onde está o veículo?
                      </label>
                      <select
                        value={form.location}
                        onChange={(event) => setForm({ ...form, location: event.target.value })}
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-500"
                      >
                        {locations.map((location) => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-7">
                      <input
                        id="vehicle-in-store"
                        type="checkbox"
                        checked={form.inStore}
                        onChange={(event) => setForm({ ...form, inStore: event.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="vehicle-in-store" className="text-sm text-gray-700">Veículo está na loja</label>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Observação
                      </label>
                      <input
                        value={form.locationNotes}
                        onChange={(event) => setForm({ ...form, locationNotes: event.target.value })}
                        placeholder="Informações adicionais sobre a localização (opcional)"
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-500"
                      />
                    </div>
                  </div>
                </section>

                <div className="border-t border-gray-100" />

                {/* Preparação */}
                <section>
                  <h3 className="mb-4 text-sm font-semibold text-gray-900">
                    Preparação do veículo
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Situação do passe
                      </label>
                      <select
                        value={form.passStatus}
                        onChange={(event) =>
                          setForm({ ...form, passStatus: event.target.value })
                        }
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-500"
                      >
                        <option value="PENDENTE">Pendente</option>
                        <option value="OK">OK</option>
                        <option value="COM_PENDENCIA">Com pendência</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Tipo de emplacamento
                      </label>
                      <select
                        value={form.platingType}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            platingType: event.target.value,
                            ...(event.target.value === 'EXTERNO' ? { plated: false } : {}),
                          })
                        }
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-500"
                      >
                        <option value="INTERNO">Interno</option>
                        <option value="EXTERNO">Externo</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      ...(form.platingType === 'EXTERNO' ? [] : [{ key: 'plated', label: 'Veículo emplacado' }]),
                      { key: 'washed', label: 'Veículo lavado' },
                      { key: 'reviewed', label: 'Veículo revisado' },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={
                            form[item.key as keyof typeof form] as boolean
                          }
                          onChange={(event) =>
                            setForm({
                              ...form,
                              [item.key]: event.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-black"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </section>

                <div className="border-t border-gray-100" />

                {/* Acessórios e serviços */}
                <section>
                  <h3 className="mb-1 text-sm font-semibold text-gray-900">
                    Acessórios e serviços
                  </h3>
                  <p className="mb-4 text-xs text-gray-500">
                    Adicione cada item individualmente e marque se é cortesia.
                    Depois, acompanhe se foi aplicado.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                    <select
                      value={form.newItemId}
                      onChange={(event) =>
                        setForm({ ...form, newItemId: event.target.value })
                      }
                      className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                    >
                      <option value="">Selecione um acessório ou serviço</option>
                      {[...accessories, ...services].map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.category === 'accessories' ? 'Acessório' : 'Serviço'} — {item.name}
                        </option>
                      ))}
                    </select>

                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={form.newItemCourtesy}
                        onChange={(event) =>
                          setForm({ ...form, newItemCourtesy: event.target.checked })
                        }
                        className="h-4 w-4 accent-black"
                      />
                      Cortesia
                    </label>

                    <button
                      type="button"
                      onClick={addDeliveryItem}
                      disabled={!form.newItemId}
                      className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#151515] px-3 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={14} />
                      Adicionar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={addCustomItem}
                    className="mt-3 text-xs font-medium text-gray-600 underline underline-offset-2"
                  >
                    Adicionar item personalizado
                  </button>

                  {form.items.length === 0 ? (
                    <p className="mt-4 rounded-md border border-dashed border-gray-200 px-3 py-5 text-center text-xs text-gray-400">
                      Nenhum acessório ou serviço adicionado.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {form.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-md border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800">{item.name}</p>
                            <p className="mt-1 text-[11px] text-gray-500">
                              {item.category === 'accessories' ? 'Acessório' : item.category === 'services' ? 'Serviço' : 'Personalizado'}
                              {item.courtesy ? ' · Cortesia' : ' · Contratado'}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-1.5 text-xs text-gray-600">
                              <input
                                type="checkbox"
                                checked={item.applied}
                                onChange={(event) =>
                                  updateDeliveryItem(item.id, { applied: event.target.checked })
                                }
                                className="h-4 w-4 accent-black"
                              />
                              Aplicado
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-gray-600">
                              <input
                                type="checkbox"
                                checked={item.courtesy}
                                onChange={(event) =>
                                  updateDeliveryItem(item.id, { courtesy: event.target.checked })
                                }
                                className="h-4 w-4 accent-black"
                              />
                              Cortesia
                            </label>
                            <button
                              type="button"
                              onClick={() => removeDeliveryItem(item.id)}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              aria-label={`Remover ${item.name}`}
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                <div className="border-t border-gray-100" />

                {/* Observações */}
                <section>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                    Observações
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(event) =>
                      setForm({ ...form, notes: event.target.value })
                    }
                    placeholder="Informações adicionais sobre a entrega..."
                    className="w-full resize-none rounded-md border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                  />
                </section>

                {error && (
                  <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-3 text-xs text-red-700">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
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
                  {editingId ? 'Salvar alterações' : 'Cadastrar entrega'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalhes */}
      {detailsOpen && selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDetailsOpen(false);
              setSelectedAppointment(null);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-[700px] overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <p className="mb-1 text-xs text-gray-500">
                  Detalhes da entrega
                </p>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedAppointment.customer}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {getModelName(selectedAppointment.modelId)}
                </p>
              </div>

              <button
                onClick={() => {
                  setDetailsOpen(false);
                  setSelectedAppointment(null);
                }}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${getStatusClass(
                    selectedAppointment.status,
                  )}`}
                >
                  {getStatusLabel(selectedAppointment.status)}
                </span>

                <span className="text-xs text-gray-500">
                  {parseDate(selectedAppointment.date).toLocaleDateString(
                    'pt-BR',
                  )}{' '}
                  às {selectedAppointment.time}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Número do pedido', selectedAppointment.orderNumber],
                  ['Cor', selectedAppointment.color],
                  [
                    'Chassi',
                    selectedAppointment.chassis
                      ? `••••••${selectedAppointment.chassis.slice(-6)}`
                      : 'Não informado',
                  ],
                  ['Localização', selectedAppointment.location],
                  ['Em loja', (selectedAppointment.inStore ?? selectedAppointment.location === 'Na loja de origem') ? 'Sim' : 'Não'],
                  ['Observação da localização', selectedAppointment.locationNotes || '—'],
                  ['Passe', selectedAppointment.passStatus],
                  ['Emplacamento', selectedAppointment.platingType],
                  ['Emplacado', selectedAppointment.plated ? 'Sim' : 'Não'],
                  [
                    'Lavagem',
                    selectedAppointment.washed ? 'Concluída' : 'Pendente',
                  ],
                  [
                    'Revisão',
                    selectedAppointment.reviewed ? 'Concluída' : 'Pendente',
                  ],
                  [
                    'Consultor de vendas',
                    getUserName(selectedAppointment.salesConsultantId),
                  ],
                  [
                    'Consultor de estética',
                    getUserName(selectedAppointment.aestheticsConsultantId),
                  ],
                  [
                    'Responsável pela entrega',
                    getUserName(selectedAppointment.responsibleId),
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="mt-1 text-sm text-gray-700">
                      {value || 'Não informado'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-800">
                  Acessórios e serviços
                </h3>
                {(selectedAppointment.items ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum item cadastrado.</p>
                ) : (
                  <div className="space-y-2">
                    {(selectedAppointment.items ?? []).map((item) => (
                      <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-100 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.category === 'accessories' ? 'Acessório' : item.category === 'services' ? 'Serviço' : 'Personalizado'}
                            {item.courtesy ? ' · Cortesia' : ''}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${item.applied ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {item.applied ? 'Aplicado' : 'Pendente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedAppointment.notes && (
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="mb-2 text-sm font-semibold text-gray-800">
                    Observações
                  </h3>
                  <p className="whitespace-pre-wrap text-sm text-gray-600">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}

              {selectedAppointment.status !== 'ENTREGUE' &&
                selectedAppointment.status !== 'CANCELADO' && (
                  <div className="border-t border-gray-100 pt-5">
                    <label className="mb-2 block text-xs font-medium text-gray-600">
                      Atualizar status
                    </label>

                    <select
                      value={selectedAppointment.status}
                      onChange={(event) =>
                        updateStatus(
                          selectedAppointment,
                          event.target.value as DeliveryStatus,
                        )
                      }
                      className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-500"
                    >
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>

                    <p className="mt-2 text-[11px] text-gray-400">
                      Ao marcar como entregue ou cancelado, a edição operacional
                      será bloqueada nesta versão.
                    </p>
                  </div>
                )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              {selectedAppointment.status !== 'ENTREGUE' &&
                selectedAppointment.status !== 'CANCELADO' && (
                  <button
                    onClick={() => openEditModal(selectedAppointment)}
                    className="flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil size={15} />
                    Editar entrega
                  </button>
                )}

              <button
                onClick={() => {
                  setDetailsOpen(false);
                  setSelectedAppointment(null);
                }}
                className="rounded-md bg-[#151515] px-4 py-2 text-sm text-white hover:bg-gray-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

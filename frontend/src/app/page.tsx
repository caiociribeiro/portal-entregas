'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  CarFront,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowUpRight,
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
  active: boolean;
}

interface User {
  id: string;
  name: string;
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
  plated: boolean;
  washed: boolean;
  reviewed: boolean;
  passStatus: string;
  salesConsultantId: string;
  responsibleId: string;
  items: DeliveryItem[];
}

const APPOINTMENTS_KEY = 'portal-entregas-appointments';
const CATALOG_KEY = 'portal-entregas-catalog';
const USERS_KEY = 'portal-entregas-users';

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  if (!value) return 'Data não informada';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function statusLabel(status: DeliveryStatus) {
  const labels: Record<DeliveryStatus, string> = {
    PRE_AGENDAMENTO: 'Pré-agendamento',
    CONFIRMADO: 'Confirmado',
    ENTREGUE: 'Entregue',
    CANCELADO: 'Cancelado',
  };
  return labels[status] ?? status;
}

function statusClass(status: DeliveryStatus) {
  const classes: Record<DeliveryStatus, string> = {
    PRE_AGENDAMENTO: 'border-amber-200 bg-amber-50 text-amber-800',
    CONFIRMADO: 'border-blue-200 bg-blue-50 text-blue-800',
    ENTREGUE: 'border-green-200 bg-green-50 text-green-800',
    CANCELADO: 'border-red-200 bg-red-50 text-red-800',
  };
  return classes[status] ?? 'border-gray-200 bg-gray-50 text-gray-700';
}

function getPendingLabels(appointment: Appointment) {
  const pending: string[] = [];
  if (appointment.passStatus !== 'OK' && appointment.passStatus !== 'APROVADO') {
    pending.push('Passe');
  }
  if (!appointment.plated) pending.push('Emplacamento');
  if (!appointment.washed) pending.push('Lavagem');
  if (!appointment.reviewed) pending.push('Revisão');
  if ((appointment.items ?? []).some((item) => !item.applied)) {
    pending.push('Acessórios/serviços');
  }
  return pending;
}

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedAppointments = localStorage.getItem(APPOINTMENTS_KEY);
      const savedCatalog = localStorage.getItem(CATALOG_KEY);
      const savedUsers = localStorage.getItem(USERS_KEY);

      if (savedAppointments) {
        const parsed = JSON.parse(savedAppointments) as Appointment[];
        setAppointments(parsed.map((item) => ({ ...item, items: item.items ?? [] })));
      }
      if (savedCatalog) setCatalog(JSON.parse(savedCatalog) as CatalogItem[]);
      if (savedUsers) setUsers(JSON.parse(savedUsers) as User[]);
    } catch (error) {
      console.error('Não foi possível carregar os dados do dashboard.', error);
    } finally {
      setLoaded(true);
    }
  }, []);

  const today = localDateString(new Date());

  const todayAppointments = useMemo(
    () => appointments.filter((item) => item.date === today && item.status !== 'CANCELADO'),
    [appointments, today],
  );

  const activeAppointments = useMemo(
    () => appointments.filter(
      (item) => item.status !== 'ENTREGUE' && item.status !== 'CANCELADO',
    ),
    [appointments],
  );

  const pendingAppointments = useMemo(
    () => activeAppointments
      .map((appointment) => ({
        appointment,
        pending: getPendingLabels(appointment),
      }))
      .filter((item) => item.pending.length > 0)
      .sort((a, b) =>
        `${a.appointment.date} ${a.appointment.time}`.localeCompare(
          `${b.appointment.date} ${b.appointment.time}`,
        ),
      ),
    [activeAppointments],
  );

  const upcomingAppointments = useMemo(
    () => appointments
      .filter((item) => item.status !== 'CANCELADO' && item.status !== 'ENTREGUE' && item.date >= today)
      .sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
      )
      .slice(0, 6),
    [appointments, today],
  );

  function modelName(modelId: string) {
    return catalog.find((item) => item.id === modelId)?.name ?? 'Modelo não informado';
  }

  function userName(userId: string) {
    return users.find((user) => user.id === userId)?.name ?? 'Não informado';
  }

  const indicators = [
    {
      title: 'Entregas de hoje',
      value: todayAppointments.length,
      description: 'Agendamentos para hoje',
      icon: CalendarDays,
    },
    {
      title: 'Em preparação',
      value: activeAppointments.length,
      description: 'Entregas ainda não concluídas',
      icon: CarFront,
    },
    {
      title: 'Pendências',
      value: pendingAppointments.length,
      description: 'Entregas com itens pendentes',
      icon: AlertCircle,
    },
    {
      title: 'Concluídas hoje',
      value: appointments.filter(
        (item) => item.date === today && item.status === 'ENTREGUE',
      ).length,
      description: 'Entregas finalizadas hoje',
      icon: CheckCircle2,
    },
  ];

  if (!loaded) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-gray-500">
        Carregando dashboard...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-7 lg:px-8 lg:py-9">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-xs text-gray-500">Principal / Dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Visão geral da operação de entregas.
          </p>
        </div>

        <Link
          href="/calendario"
          className="flex items-center justify-center gap-2 rounded-md bg-[#151515] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={17} />
          Nova entrega
        </Link>
      </div>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicators.map((indicator) => {
          const Icon = indicator.icon;
          return (
            <div
              key={indicator.title}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-gray-500">{indicator.title}</p>
                <div className="rounded-md bg-gray-100 p-2 text-gray-600">
                  <Icon size={19} />
                </div>
              </div>
              <p className="text-3xl font-semibold text-gray-900">{indicator.value}</p>
              <p className="mt-1 text-xs text-gray-400">{indicator.description}</p>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5">
            <div>
              <h2 className="font-semibold text-gray-900">Próximas entregas</h2>
              <p className="mt-1 text-xs text-gray-500">Agenda a partir de hoje</p>
            </div>
            <Link
              href="/calendario"
              className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-black"
            >
              Ver calendário <ArrowUpRight size={15} />
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-5 py-10 text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-4">
                <CalendarDays size={25} className="text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-800">Nenhuma entrega próxima</h3>
              <p className="mt-2 max-w-sm text-xs leading-5 text-gray-400">
                Os próximos agendamentos cadastrados aparecerão aqui.
              </p>
              <Link
                href="/calendario"
                className="mt-5 flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus size={15} /> Cadastrar entrega
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcomingAppointments.map((appointment) => (
                <Link
                  href="/calendario"
                  key={appointment.id}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {appointment.customer}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClass(appointment.status)}`}>
                        {statusLabel(appointment.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {modelName(appointment.modelId)} · {appointment.color || 'Cor não informada'}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Consultor: {userName(appointment.salesConsultantId)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-gray-600">
                    <CalendarDays size={14} />
                    {formatDate(appointment.date)}
                    <Clock size={14} className="ml-2" />
                    {appointment.time}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-5">
            <h2 className="font-semibold text-gray-900">Atenção necessária</h2>
            <p className="mt-1 text-xs text-gray-500">Entregas com preparação pendente</p>
          </div>

          {pendingAppointments.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-5 py-10 text-center">
              <div className="mb-4 rounded-full bg-green-50 p-4">
                <CheckCircle2 size={25} className="text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-800">Nenhuma pendência identificada</h3>
              <p className="mt-2 text-xs leading-5 text-gray-400">
                Quando houver itens de preparação pendentes, eles serão listados aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingAppointments.slice(0, 6).map(({ appointment, pending }) => (
                <Link
                  href="/calendario"
                  key={appointment.id}
                  className="block px-5 py-4 transition hover:bg-gray-50"
                >
                  <p className="text-sm font-medium text-gray-900">{appointment.customer}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {modelName(appointment.modelId)} · {formatDate(appointment.date)} às {appointment.time}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pending.map((label) => (
                      <span key={label} className="rounded bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800">
                        {label}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="mt-10 border-t border-gray-200 pt-5">
        <p className="text-center text-[11px] text-gray-400">
          Grupo New · Portal de Entregas
        </p>
      </footer>
    </div>
  );
}

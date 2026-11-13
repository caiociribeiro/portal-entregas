import {
  CalendarDays,
  CarFront,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowUpRight,
} from 'lucide-react';

const indicators = [
  {
    title: 'Entregas de hoje',
    value: '0',
    description: 'Nenhuma entrega cadastrada',
    icon: CalendarDays,
  },
  {
    title: 'Em preparação',
    value: '0',
    description: 'Veículos em preparação',
    icon: CarFront,
  },
  {
    title: 'Pendências',
    value: '0',
    description: 'Itens que precisam de atenção',
    icon: AlertCircle,
  },
  {
    title: 'Concluídas',
    value: '0',
    description: 'Entregas finalizadas hoje',
    icon: CheckCircle2,
  },
];

export default function Dashboard() {
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

        <button className="flex items-center justify-center gap-2 rounded-md bg-[#151515] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
          <Plus size={17} />
          Nova entrega
        </button>
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

              <p className="text-3xl font-semibold text-gray-900">
                {indicator.value}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {indicator.description}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5">
            <div>
              <h2 className="font-semibold text-gray-900">Próximas entregas</h2>
              <p className="mt-1 text-xs text-gray-500">
                Acompanhamento da agenda
              </p>
            </div>

            <a
              href="/calendario"
              className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-black"
            >
              Ver calendário
              <ArrowUpRight size={15} />
            </a>
          </div>

          <div className="flex min-h-[260px] flex-col items-center justify-center px-5 py-10 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <CalendarDays size={25} className="text-gray-400" />
            </div>

            <h3 className="text-sm font-medium text-gray-800">
              Nenhuma entrega cadastrada
            </h3>
            <p className="mt-2 max-w-sm text-xs leading-5 text-gray-400">
              As entregas agendadas serão exibidas aqui para facilitar o
              acompanhamento da operação.
            </p>

            <button className="mt-5 flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
              <Plus size={15} />
              Cadastrar primeira entrega
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-5">
            <h2 className="font-semibold text-gray-900">Atenção necessária</h2>
            <p className="mt-1 text-xs text-gray-500">Pendências da operação</p>
          </div>

          <div className="flex min-h-[260px] flex-col items-center justify-center px-5 py-10 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <Clock size={25} className="text-gray-400" />
            </div>

            <h3 className="text-sm font-medium text-gray-800">
              Nenhuma pendência
            </h3>
            <p className="mt-2 text-xs leading-5 text-gray-400">
              As pendências de preparação e documentação aparecerão nesta área.
            </p>
          </div>
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

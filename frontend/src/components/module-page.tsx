import type { LucideIcon } from 'lucide-react';

interface ModulePageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function ModulePage({
  title,
  description,
  icon: Icon,
}: ModulePageProps) {
  return (
    <div className="mx-auto max-w-[1600px] px-5 py-7 lg:px-8 lg:py-9">
      <div className="mb-8">
        <p className="mb-1 text-xs text-gray-500">
          Portal de Entregas / {title}
        </p>

        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {title}
        </h1>

        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-12 text-center shadow-sm">
        <div className="mb-4 rounded-full bg-gray-100 p-4">
          <Icon size={28} className="text-gray-500" />
        </div>

        <h2 className="text-base font-semibold text-gray-800">
          Módulo em desenvolvimento
        </h2>

        <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
          Esta área será implementada nas próximas etapas do Portal de Entregas.
        </p>
      </div>
    </div>
  );
}

import { Settings } from 'lucide-react';
import ModulePage from '@/components/module-page';

export default function SettingsPage() {
  return (
    <ModulePage
      title="Configurações"
      description="Configure as opções e parâmetros do Portal de Entregas."
      icon={Settings}
    />
  );
}

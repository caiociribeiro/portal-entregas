import { ClipboardList } from 'lucide-react';
import ModulePage from '@/components/module-page';

export default function WashingPage() {
  return (
    <ModulePage
      title="Programação de lavagem"
      description="Organize os veículos que precisam ser lavados."
      icon={ClipboardList}
    />
  );
}

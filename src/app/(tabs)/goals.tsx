import { Screen } from '@/components/ui/screen';
import { Placeholder } from '@/components/ui/placeholder';

export default function GoalsScreen() {
  return (
    <Screen>
      <Placeholder
        icon="flag"
        title="Objetivos"
        message="Presupuestos por categoría y metas de ahorro con su progreso."
      />
    </Screen>
  );
}

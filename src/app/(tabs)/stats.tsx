import { Screen } from '@/components/ui/screen';
import { Placeholder } from '@/components/ui/placeholder';

export default function StatsScreen() {
  return (
    <Screen>
      <Placeholder
        icon="pie-chart"
        title="Estadísticas"
        message="Reportes con gráficos de gastos por categoría, evolución del saldo y comparativas."
      />
    </Screen>
  );
}

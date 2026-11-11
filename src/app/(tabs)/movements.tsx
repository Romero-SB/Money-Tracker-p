import { Screen } from '@/components/ui/screen';
import { Placeholder } from '@/components/ui/placeholder';

export default function MovementsScreen() {
  return (
    <Screen>
      <Placeholder
        icon="swap-horizontal"
        title="Movimientos"
        message="Historial y gestión de ingresos, gastos y transferencias con sus comprobantes."
      />
    </Screen>
  );
}

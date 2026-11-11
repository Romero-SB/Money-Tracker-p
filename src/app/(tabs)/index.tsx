import { Screen } from '@/components/ui/screen';
import { Placeholder } from '@/components/ui/placeholder';

export default function HomeScreen() {
  return (
    <Screen>
      <Placeholder
        icon="wallet"
        title="Panel financiero"
        message="Aquí verás tu saldo total, ingresos, gastos del período y tus últimos movimientos."
      />
    </Screen>
  );
}

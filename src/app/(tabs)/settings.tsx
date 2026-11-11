import { Screen } from '@/components/ui/screen';
import { Placeholder } from '@/components/ui/placeholder';

export default function SettingsScreen() {
  return (
    <Screen>
      <Placeholder
        icon="settings"
        title="Ajustes"
        message="Cuentas, categorías, moneda, seguridad, notificaciones y copias de seguridad."
      />
    </Screen>
  );
}

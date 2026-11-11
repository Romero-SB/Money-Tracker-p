# Money Tracker

Aplicación móvil de administración financiera personal construida con React Native, Expo y TypeScript.

Permite controlar ingresos, gastos, cuentas, presupuestos, ahorros y movimientos económicos de forma local, sin conexión a Internet.

## Stack

- React Native + Expo (Expo Router)
- TypeScript
- SQLite local (expo-sqlite)
- Archivos y comprobantes locales (expo-file-system, expo-image-picker, expo-document-picker)

## Desarrollo

```bash
npm install
npx expo start
```

Escanea el código QR con la app Expo Go en tu teléfono (misma red Wi-Fi).

## Estructura

```
src/
  app/          Pantallas y navegación (Expo Router)
  components/   Componentes reutilizables
  constants/    Tema y constantes
  db/           Esquema, migraciones y repositorios SQLite
  hooks/        Hooks personalizados
  services/     Lógica de negocio
  types/        Modelos y tipos
  utils/        Utilidades
```

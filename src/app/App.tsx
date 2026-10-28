import { AppShell } from '../components/app-shell/AppShell';
import { PreferencesProvider } from './PreferencesProvider';

export function App() {
  return (
    <PreferencesProvider>
      <AppShell />
    </PreferencesProvider>
  );
}

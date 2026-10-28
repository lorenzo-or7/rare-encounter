import { MotionConfig } from 'motion/react';
import { AppShell } from '../components/app-shell/AppShell';
import { PreferencesProvider } from './PreferencesProvider';

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <PreferencesProvider>
        <AppShell />
      </PreferencesProvider>
    </MotionConfig>
  );
}

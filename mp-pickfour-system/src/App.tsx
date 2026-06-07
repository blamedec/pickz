import { Theme } from './settings/types';
import { PickFourSharedDesignSystem } from './components/generated/PickFourSharedDesignSystem';

let theme: Theme = 'light';

function App() {
  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  return (
    <>
      <PickFourSharedDesignSystem />
    </>
  ); // %EXPORT_STATEMENT%
}

export default App;

import { Theme } from './settings/types';
import { PickFourOverhaulDirection } from './components/generated/PickFourOverhaulDirection';

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
      <PickFourOverhaulDirection />
    </>);
  // %EXPORT_STATEMENT%
}

export default App;
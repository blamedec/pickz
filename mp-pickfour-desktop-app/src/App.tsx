import { Theme } from './settings/types';
import { PickFourDesktopApp } from './components/generated/PickFourDesktopApp';

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
      <PickFourDesktopApp />
    </>
  ); // %EXPORT_STATEMENT%
}

export default App;

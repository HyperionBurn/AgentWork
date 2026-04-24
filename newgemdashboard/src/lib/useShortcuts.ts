import { useEffect } from 'react';

export function useShortcuts(setActiveTab?: (tab: string) => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger standard shortcuts if user is typing in an input
      const isInput = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      
      // Global ESC handler
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('closeModals'));
        return;
      }

      // Modifier combos (like Cmd+K / Ctrl+K for search)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('openSearchMode'));
        return;
      }

      if (isInput) return;

      switch (e.key) {
        case '1': setActiveTab?.('overview'); break;
        case '2': setActiveTab?.('agents'); break;
        case '3': setActiveTab?.('tasks'); break;
        case '4': setActiveTab?.('network'); break;
        case '5': setActiveTab?.('settings'); break;
        case '?': window.dispatchEvent(new CustomEvent('toggleHelpMode')); break;
        case 'e': 
          if(setActiveTab) {
             setActiveTab('settings');
             // small delay to let tab switch happen before animating export
             setTimeout(() => window.dispatchEvent(new CustomEvent('triggerExport')), 100);
          }
          break;
        case 'Enter': 
          if(document.activeElement?.tagName !== 'BUTTON') {
             window.dispatchEvent(new CustomEvent('triggerDemoSequence'));
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);
}

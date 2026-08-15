import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import i18n from '@/lib/i18n';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Top-level catch for uncaught render errors. Without this, a crash anywhere in the tree unmounts to
// a blank white page. The fallback is deliberately generic — logs the real error to the console for
// whoever's debugging, but never renders the error message/stack to the user (it's often a raw
// exception message that means nothing to them and could leak implementation detail).
// Plain <a> tags, not <Link>/useTranslation — after a render crash we can't assume Router context or
// hooks are still safe to use, so the fallback stays framework-minimal and always works.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="app-gradient grid min-h-dvh place-items-center p-6 text-center">
        <div className="glass flex max-w-sm flex-col items-center gap-4 rounded-2xl p-8 shadow-sm">
          <div className="grid size-14 place-items-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{i18n.t('errorBoundary.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{i18n.t('errorBoundary.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <a href="/">{i18n.t('errorBoundary.goHome')}</a>
            </Button>
            <Button onClick={() => window.location.reload()}>{i18n.t('errorBoundary.reload')}</Button>
          </div>
        </div>
      </div>
    );
  }
}

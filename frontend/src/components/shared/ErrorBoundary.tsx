import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // You can also log the error to an error reporting service here
    // e.g., Sentry.captureException(error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="max-w-md p-8">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h2 className="mb-2 text-center text-xl font-semibold">Something went wrong</h2>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              We're sorry, but something unexpected happened. Please try again.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 rounded-md bg-muted p-3">
                <p className="mb-1 text-xs font-semibold">Error details:</p>
                <p className="text-xs text-muted-foreground">{this.state.error.message}</p>
              </div>
            )}
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Go Home
              </Button>
              <Button onClick={this.handleReset}>Try Again</Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}


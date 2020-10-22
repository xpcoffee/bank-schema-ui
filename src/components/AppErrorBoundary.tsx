import React from "react";
import { State } from "../store/reducers";

interface Props extends Readonly<{}> {
  appState: State;
}
interface ErrorState {
  hasError: boolean;
  appState: State;
}

export class AppErrorBoundary extends React.Component<Props, ErrorState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, appState: props.appState };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    // You can also log the error to an error reporting service
    console.log({ error, errorInfo, appState: this.state.appState });
    this.setState((state) => {
      return { ...state, hasError: true };
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div>
          <h1>Something went wrong.</h1>
          <p>
            The last state of the app has been logged in the browser console for
            debugging purposes.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

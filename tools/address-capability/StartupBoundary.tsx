import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { STARTUP_FAILURE } from './bootstrap';
export function StartupFailure() { return <p role="alert">{STARTUP_FAILURE}</p>; }
export class StartupBoundary extends Component<{children: ReactNode},{failed: boolean}> {
  state={failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  render() { return this.state.failed ? <StartupFailure /> : this.props.children; }
}

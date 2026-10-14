import { Component } from "react";

export default class ProjectErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Project screen error:", error);
  }

  render() {
    if(this.state.failed) {
      return (
        <section className="auth-panel">
          <h1>Could not display projects</h1>
          <p className="feedback error">An unexpected screen error occurred. Check the browser console for details.</p>
          <button className="primary" onClick={() => this.setState({ failed: false })}>Try again</button>
        </section>
      );
    }
    return this.props.children;
  }
}

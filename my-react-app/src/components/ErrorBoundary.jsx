import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Đã xảy ra lỗi
            </h1>
            <p className="text-gray-600 mb-6">
              Xin lỗi, có vấn đề xảy ra khi tải trang. Vui lòng thử lại sau.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left text-xs font-mono overflow-auto max-h-48">
                <p className="text-red-600 font-semibold mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-gray-700 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[#1B4332] text-white rounded-lg hover:bg-[#14532d] transition-colors font-medium"
              >
                Tải lại trang
              </button>
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


/**
 * Performance Monitoring Utilities
 * Track page load times and performance metrics
 */

const performanceEnabled = true;

// Track page load performance
export const trackPageLoad = () => {
  if (!performanceEnabled || typeof window === "undefined" || !window.performance) {
    return;
  }

  try {
    const navigation = performance.getEntriesByType("navigation")[0];
    if (!navigation) return;

    const metrics = {
      // DNS lookup time
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      // TCP connection time
      tcp: navigation.connectEnd - navigation.connectStart,
      // Request time
      request: navigation.responseStart - navigation.requestStart,
      // Response time
      response: navigation.responseEnd - navigation.responseStart,
      // DOM processing time
      domProcessing: navigation.domComplete - navigation.domInteractive,
      // Page load time
      pageLoad: navigation.loadEventEnd - navigation.fetchStart,
      // Time to first byte
      ttfb: navigation.responseStart - navigation.fetchStart,
      // Time to interactive
      tti: navigation.domInteractive - navigation.fetchStart,
      // Total time
      total: navigation.loadEventEnd - navigation.fetchStart,
    };

    // Log in development
    if (import.meta.env.DEV) {
      console.log("📊 Performance Metrics:", metrics);
    }

    // Store in localStorage
    try {
      const perfData = JSON.parse(localStorage.getItem("performance_metrics") || "[]");
      perfData.push({
        ...metrics,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 50 entries
      if (perfData.length > 50) {
        perfData.shift();
      }

      localStorage.setItem("performance_metrics", JSON.stringify(perfData));
    } catch (e) {
      // Ignore storage errors
    }

    // In production, send to analytics service
    // Example: gtag('event', 'page_load_time', { value: metrics.pageLoad });
  } catch (error) {
    // Silently fail
  }
};

// Track custom performance marks
export const markStart = (name) => {
  if (typeof window !== "undefined" && window.performance && window.performance.mark) {
    performance.mark(`${name}-start`);
  }
};

export const markEnd = (name) => {
  if (typeof window !== "undefined" && window.performance && window.performance.mark) {
    performance.mark(`${name}-end`);
    try {
      performance.measure(name, `${name}-start`, `${name}-end`);
      const measure = performance.getEntriesByName(name)[0];
      if (measure) {
        const duration = measure.duration;
        if (import.meta.env.DEV) {
          console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        }
        return duration;
      }
    } catch (e) {
      // Ignore errors
    }
  }
  return null;
};

// Get performance metrics
export const getPerformanceMetrics = () => {
  try {
    return JSON.parse(localStorage.getItem("performance_metrics") || "[]");
  } catch {
    return [];
  }
};

// Clear performance metrics
export const clearPerformanceMetrics = () => {
  localStorage.removeItem("performance_metrics");
};

// Track resource loading times
export const trackResourceLoad = () => {
  if (typeof window === "undefined" || !window.performance) return;

  try {
    const resources = performance.getEntriesByType("resource");
    const slowResources = resources.filter(
      (resource) => resource.duration > 1000 // Resources taking more than 1 second
    );

    if (slowResources.length > 0 && import.meta.env.DEV) {
      console.warn("⚠️ Slow resources detected:", slowResources);
    }
  } catch (e) {
    // Ignore errors
  }
};


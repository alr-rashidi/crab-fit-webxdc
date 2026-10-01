// WebXDC API Integration

export function getWebXdcIdentity() {
  if (typeof window !== 'undefined' && window.webxdc) {
    return {
      name: window.webxdc.selfName || 'User',
      addr: window.webxdc.selfAddr || 'user'
    };
  }
  return {
    name: 'User',
    addr: 'user'
  };
}

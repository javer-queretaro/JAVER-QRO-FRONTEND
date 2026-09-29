(function (root) {
  function formNameFromOrigen(formOrigen) {
    if (formOrigen === 'lead-form-1' || formOrigen === 'lead-form-2') {
      return 'javer_qro_' + formOrigen;
    }
    return '';
  }

  function createSubmitGuard() {
    let pending = false;
    return {
      tryAcquire() {
        if (pending) return false;
        pending = true;
        return true;
      },
      release() {
        pending = false;
      }
    };
  }

  function readCookieFromString(cookieString, name) {
    const cookies = String(cookieString || '').split(';');
    for (const part of cookies) {
      const trimmed = part.trim();
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      if (trimmed.slice(0, eq) === name) {
        try {
          return decodeURIComponent(trimmed.slice(eq + 1));
        } catch {
          return trimmed.slice(eq + 1);
        }
      }
    }
    return '';
  }

  function resolveFbc({ fbcCookie, fbclid, timestamp }) {
    if (fbcCookie) return fbcCookie;
    if (!fbclid) return '';
    const ts = Number.isFinite(timestamp) ? timestamp : Date.now();
    return 'fb.1.' + ts + '.' + fbclid;
  }

  function shouldTrackLead(result) {
    return Boolean(
      result &&
      result.message === 'Formulario enviado correctamente' &&
      typeof result.event_id === 'string' &&
      result.event_id.length > 0
    );
  }

  function trackLead(fbq, formOrigen, result) {
    if (typeof fbq !== 'function' || !shouldTrackLead(result)) return null;
    const formName = formNameFromOrigen(formOrigen);
    const customData = formName ? { form_name: formName } : {};
    fbq('track', 'Lead', customData, { eventID: result.event_id });
    return { eventID: result.event_id, form_name: formName };
  }

  root.MetaLead = {
    formNameFromOrigen,
    createSubmitGuard,
    readCookieFromString,
    resolveFbc,
    shouldTrackLead,
    trackLead
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

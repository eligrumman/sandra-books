// PostHog (EU), cookieless: persistence in memory only, no session recording, no cookies, no localStorage.
// Opt-out: open any page with ?notrack=1 to stop counting this device (stored in localStorage sl_notrack); ?notrack=0 counts it again.
(function () {
  var off = false;
  try {
    var q = new URLSearchParams(location.search).get('notrack');
    if (q === '1') { localStorage.setItem('sl_notrack', '1'); notify(); }
    else if (q === '0') { localStorage.removeItem('sl_notrack'); }
    off = localStorage.getItem('sl_notrack') === '1';
  } catch (e) {}
  function notify() {
    try {
      var l = (document.documentElement.lang || 'he').slice(0, 2);
      var m = {he: 'המכשיר הזה לא נספר בסטטיסטיקה', ru: 'Это устройство не учитывается в статистике', en: 'This device is not counted in the statistics'}[l] || 'This device is not counted in the statistics';
      var t = document.createElement('div');
      t.setAttribute('role', 'status');
      t.textContent = m;
      t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;background:#222;color:#fff;font:14px/1.4 system-ui,sans-serif;padding:10px 16px;border-radius:8px;max-width:90vw;text-align:center';
      var add = function () { document.body.appendChild(t); setTimeout(function () { t.remove(); }, 4000); };
      if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
    } catch (e) {}
  }
  if (off) return;
// The token is a public write-only project token. Loaded async, never blocks rendering.
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('phc_BHSCrAG3yBysd3P5FE57unnBqT3vyMY3LULAToiQAtXs', {
  api_host: 'https://eu.i.posthog.com',
  ui_host: 'https://eu.posthog.com',
  persistence: 'memory',
  disable_session_recording: true,
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true
});
// WhatsApp taps: the site dispatches 'sl:wa' on document (detail = {type: 'work'|'book'|'hello', slug}).
document.addEventListener('sl:wa', function (e) { posthog.capture('whatsapp_click', e.detail); });
})();

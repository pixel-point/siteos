# GA4 with GTM and SiteOS Cookie

Use the existing reviewed GA4 web stream and exact Measurement ID. Creating a Google account,
property, stream or publishing GTM requires the user's authorization. This setup is separate from
Trace's read-only Admin/Data API connection. Do not enable AI, advertising or enhanced measurement
implicitly. Preserve existing tags, consent policy and unrelated workspace changes.

For Basic mode, select `google-analytics` in the full Cookie draft and publish the reviewed
configuration. Use the SiteOS Cookie GTM template on Consent Initialization. Add a Custom Event
trigger named for analytics consent, with exact event `siteos_analytics_granted`, without regex.
This fires both for an allowed returning visit and for consent granted on the current page.

Configure the Google tag with the stream's Measurement ID, this trigger, **Once per page**, and
additional required consent `analytics_storage`. Do not leave its default Initialization trigger.

## Stop an initialized Google library on withdrawal

An already loaded Google library may emit `user_engagement` on the controlled reload after
withdrawal. Google documents `window['ga-disable-MEASUREMENT_ID']` as the explicit measurement
disable control: [Google privacy settings](https://developers.google.com/tag-platform/security/guides/privacy).

For a single GA4 stream, add a Custom HTML guard on the same grant trigger, **Once per page**,
with priority **100** while the Google tag retains priority **0**. It has no external script or
network call. Replace `G-EXAMPLE1` below with the verified Measurement ID. The Cookie APIs exist
before this runtime-generated grant event. Inspect existing vendor adapters before registering
this one: one adapter per vendor means an existing implementation must be composed, not replaced.

```html
<script>
  (function () {
    var key = "ga-disable-G-EXAMPLE1";
    var api = window.SiteOSCookie;
    window[key] = true;
    if (!api || typeof api.registerGoogleConsentListener !== "function") return;
    api.registerGoogleConsentListener(function (state) {
      window[key] = state.analytics_storage !== "granted";
    });
    api.registerVendorAdapter("google-analytics", {
      teardown: function () {
        window[key] = true;
        return { complete: true };
      },
    });
  })();
</script>
```

`complete: true` reports that the reviewed stream has stopped sending, so Cookie can clean its
storage without forcing a reload. The Google library remains loaded and the consent listener
re-enables sending only after a later grant. Verify this behavior with the real tag before claiming
complete teardown. Multiple streams require one composed adapter that disables every reviewed
Measurement ID; preserve a reload fallback for any unhandled resource. Explicitly selected
Advanced mode needs separate behavior.

## Evidence

Use CLI 2.3.1+ `cookie verify --browser chromium --json` and `--browser webkit --json` on the
selected environment, then perform visible banner interaction checks. Verify no GA4 library or
collection before consent/after refusal, one pageview immediately after consent, returning consent,
withdrawal without a final GA4 hit, cleared GA cookies, and refused reload. Reopening/saving the
same consent must not initialize the Google tag again. Keep unknown resources and failures visible.

`/gtm.js` can deliver Cookie and Trace before consent; it alone is not a GA4 event. `/gtag/js` and
GA4 `/g/collect`, including `region1.google-analytics.com`, are separate evidence. A successful
network request does not establish its arrival in a GA4 report. Use Trace's exact stream binding
and a real Admin/Data read; daily discrepancy checks still need mature reports and sufficient
browser evidence. Report the tested routes, browsers and actual Edge region.

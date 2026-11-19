// Applies owner-edited text (admin console > Content) over the built-in copy.
// Built-in text stays if the request fails, so the site never depends on this.
const { supabaseUrl, supabaseKey } = document.body.dataset;

if (supabaseUrl && supabaseKey) {
  fetch(`${supabaseUrl}/rest/v1/site_content?select=key,value`, { headers: { apikey: supabaseKey } })
    .then((response) => (response.ok ? response.json() : []))
    .then((rows) => {
      for (const { key, value } of rows) {
        // textContent only: owner text is never parsed as HTML.
        document.querySelectorAll(`[data-cms="${CSS.escape(key)}"]`).forEach((el) => { el.textContent = value; });
      }
    })
    .catch(() => {});
}

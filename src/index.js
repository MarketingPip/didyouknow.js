// --- Constants & Pure Helpers ---
export const API_BASE = "https://en.wikipedia.org/w/api.php";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export function getRandomValidMonthAndYear() {
  const today = new Date();
  const maxYear = today.getFullYear();
  const minYear = 2004;

  const year = maxYear === minYear ? maxYear : getRandomInt(minYear, maxYear);
  const monthIdx = year === maxYear ? getRandomInt(0, today.getMonth()) : getRandomInt(0, 11);

  return { year, month: MONTHS[monthIdx] };
}

// --- Independent API Fetcher (Pure, no DOM overhead) ---
export async function fetchPageHTML(pageTitle) {
  const params = new URLSearchParams({
    action: "parse",
    page: pageTitle,
    prop: "text",
    format: "json",
    origin: "*"
  });

  const res = await fetch(`${API_BASE}?${params}`, {
    headers: { "Accept": "application/json" }
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const data = await res.json();
  if (data.error) throw new Error(`API: ${data.error.info}`);
 
  return {data, url:`${API_BASE}?${params}`};
}

// --- Text Cleanup Cleaned up ---
export function cleanFactText(rawText) {
  const cleaned = rawText
    .replace(/^\.*\s*that\s+/i, "")
    // Removes "(pictured)", "(illustrated)", etc.
    .replace(/\((?=[^)]*\b(?:pictured|illustrated|shown|depicted|photographed|photo(?:graphed)?|image|portrait|drawing|painting|rendering|map|diagram|chart|logo|seal|flag|emblem|coat of arms|insignia)\b)[^)]*\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).slice(0, -1);
}

// --- Pure Parser Orchestrators ---
// Pass `doc` explicitly so this function remains entirely environment-agnostic
export function extractFactsFromDoc(doc) {
  const listItems = Array.from(doc.querySelectorAll("li"));
  
  const factLis = listItems.filter(li =>
    /^\.*\s*that\s+/i.test(li.textContent.trim())
  );

  const facts = factLis.map(li => cleanFactText(li.textContent));
  return [...new Set(facts)].filter(text => text.length > 10);
}

export function extractLinksFromElement(liElement, factText) {
  const links = Array.from(liElement.querySelectorAll("a[href^='/wiki/']"))
    .map(a => ({
      entity: a.textContent.trim(),
      page: decodeURIComponent(a.getAttribute("href").replace("/wiki/", "").replace(/_/g, " "))
    }))
    .filter(link => factText.toLowerCase().includes(link.entity.toLowerCase()))
    .map(({ entity, page }) => ({
      entity,
      ...(page !== entity ? { alsoKnownAs: page } : {})
    }));

  return links.filter((link, idx, arr) =>
    arr.findIndex(l => l.entity === link.entity) === idx
  );
}

// --- Environment-Aware Entrypoint Factory ---
// This factory creates your main functions without bundling specific DOM engines
export function createDidYouKnowFetcher(parseHTMLFn) {
  async function didyouknow() {
    const { year, month } = getRandomValidMonthAndYear();
    const page = `Wikipedia:Did_you_know_archive/${year}/${month}`;

    const html = await fetchPageHTML(page);
    const url  = html.url;
    const data = html.data;
    const doc = await parseHTMLFn(data.parse.text["*"]);
    const facts = extractFactsFromDoc(doc);

    if (!facts.length) return didyouknow(); // Retry
    return {page,url, pageid:html.data.parse.pageid, facts};
  }


  return  didyouknow;
}


const parseHTML = (html) => new DOMParser().parseFromString(html, "text/html");

const  didyouknow = createDidYouKnowFetcher(parseHTML);

console.log(await didyouknow())

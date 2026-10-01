(() => {
  const app = document.getElementById("app");
  const back = document.getElementById("back");
  const ring = document.getElementById("ring");
  const STORE = "learning-hub:done";

  let topics = [];

  // ---- progress (saved on this device only) ----
  const loadDone = () => {
    try { return new Set(JSON.parse(localStorage.getItem(STORE) || "[]")); }
    catch { return new Set(); }
  };
  const saveDone = (set) => {
    try { localStorage.setItem(STORE, JSON.stringify([...set])); } catch {}
  };
  const key = (t, l) => `${t}/${l}`;

  // ---- tiny markdown renderer ----
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) =>
    esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Syntax: "?? question || answer" becomes a tap-to-reveal check.
  function render(md) {
    const out = [];
    const lines = md.replace(/\r/g, "").split("\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      if (line.startsWith("```")) {
        const buf = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
        i++;
        out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
      } else if (/^#{1,3} /.test(line)) {
        const n = line.match(/^#+/)[0].length;
        out.push(`<h${n}>${inline(line.slice(n + 1))}</h${n}>`);
        i++;
      } else if (line.startsWith("?? ")) {
        const [q, a = ""] = line.slice(3).split("||");
        out.push(`<details class="check"><summary><span>${inline(q.trim())}</span></summary><div class="answer">${inline(a.trim())}</div></details>`);
        i++;
      } else if (line.startsWith("> ")) {
        const buf = [];
        while (i < lines.length && lines[i].startsWith("> ")) buf.push(lines[i++].slice(2));
        out.push(`<blockquote><p>${inline(buf.join(" "))}</p></blockquote>`);
      } else if (/^[-*] /.test(line)) {
        const buf = [];
        while (i < lines.length && /^[-*] /.test(lines[i])) buf.push(`<li>${inline(lines[i++].slice(2))}</li>`);
        out.push(`<ul>${buf.join("")}</ul>`);
      } else if (/^\d+\. /.test(line)) {
        const buf = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) buf.push(`<li>${inline(lines[i++].replace(/^\d+\. /, ""))}</li>`);
        out.push(`<ol>${buf.join("")}</ol>`);
      } else {
        const buf = [];
        while (i < lines.length && lines[i].trim() && !/^(#{1,3} |```|> |[-*] |\d+\. |\?\? )/.test(lines[i])) buf.push(lines[i++]);
        out.push(`<p>${inline(buf.join(" "))}</p>`);
      }
    }
    return out.join("\n");
  }

  // ---- views ----
  function updateRing() {
    const done = loadDone();
    const total = topics.reduce((n, t) => n + t.lessons.length, 0);
    const finished = topics.reduce((n, t) => n + t.lessons.filter((l) => done.has(key(t.id, l.id))).length, 0);
    const pct = total ? Math.round((finished / total) * 100) : 0;
    ring.style.setProperty("--p", pct);
    ring.innerHTML = `<span>${pct}%</span>`;
  }

  // Every "?? question || answer" across all lessons, fetched once per visit.
  let questionPool = null;
  let homeStamp = 0;
  async function loadQuestions() {
    if (questionPool) return questionPool;
    const found = [];
    await Promise.all(topics.flatMap((t) => t.lessons.map(async (l) => {
      try {
        const res = await fetch(`lessons/${t.id}/${l.file}`);
        if (!res.ok) return;
        for (const line of (await res.text()).replace(/\r/g, "").split("\n")) {
          if (!line.startsWith("?? ")) continue;
          const [q, a = ""] = line.slice(3).split("||");
          found.push({ q: q.trim(), a: a.trim(), topic: t, lesson: l });
        }
      } catch {}
    })));
    questionPool = found;
    return found;
  }

  async function showRecall(stamp, avoid) {
    const pool = await loadQuestions();
    const box = document.getElementById("recall");
    if (!box || stamp !== homeStamp || !pool.length) return;
    const choices = pool.length > 1 ? pool.filter((x) => x.q !== avoid) : pool;
    const pick = choices[Math.floor(Math.random() * choices.length)];
    box.innerHTML = `
      <h1 class="q"><span class="mark">${inline(pick.q)}</span></h1>
      <button class="btn auto" id="reveal" aria-expanded="false" aria-controls="answer">Show answer</button>
      <div class="a" id="answer" hidden>${inline(pick.a)}</div>
      <p class="src">From <a href="#/lesson/${pick.topic.id}/${pick.lesson.id}">${esc(pick.lesson.title)}</a>.
        ${pool.length > 1 ? '<button class="link-btn" id="another">Another question</button>' : ""}</p>`;
    const reveal = document.getElementById("reveal");
    const answer = document.getElementById("answer");
    reveal.onclick = () => {
      answer.hidden = false;
      reveal.hidden = true;
    };
    const another = document.getElementById("another");
    if (another) another.onclick = () => showRecall(stamp, pick.q);
  }

  function home() {
    const done = loadDone();
    const rows = topics.map((t) => {
      const pips = t.lessons.map((l) => `<i class="pip ${done.has(key(t.id, l.id)) ? "on" : ""}"></i>`).join("");
      const n = t.lessons.filter((l) => done.has(key(t.id, l.id))).length;
      return `<a class="topic-row" href="#/topic/${t.id}">
        <h3><span>${esc(t.title)}</span></h3>
        <p>${esc(t.summary)}</p>
        <div class="pips" role="img" aria-label="${n} of ${t.lessons.length} lessons complete">${pips}</div>
      </a>`;
    });
    app.innerHTML = `
      <section class="recall" id="recall">
        <h1 class="empty-q">Pick a topic and start learning.</h1>
      </section>
      <div class="index">${rows.join("") || '<div class="empty">No topics yet.</div>'}</div>
      <p class="footer-note">Progress is saved on this device.</p>`;
    showRecall(++homeStamp);
  }

  function topicView(id) {
    const t = topics.find((x) => x.id === id);
    if (!t) return notFound();
    const done = loadDone();
    const rows = t.lessons.map((l, i) => {
      const d = done.has(key(t.id, l.id));
      return `<a class="lesson-row ${d ? "done" : ""}" href="#/lesson/${t.id}/${l.id}">
        <span class="num">${d ? "✓" : i + 1}</span>
        <span class="t"><span>${esc(l.title)}</span><span class="m">${l.minutes} min read</span></span>
      </a>`;
    });
    app.innerHTML = `
      <section class="hero">
        <h1>${esc(t.title)}</h1>
        <p>${esc(t.summary)}</p>
      </section>
      <div class="list">${rows.join("") || '<div class="empty">Lessons coming soon.</div>'}</div>`;
  }

  async function lessonView(tid, lid) {
    const t = topics.find((x) => x.id === tid);
    const idx = t ? t.lessons.findIndex((l) => l.id === lid) : -1;
    if (idx < 0) return notFound();
    const lesson = t.lessons[idx];
    app.innerHTML = '<p class="crumb">Loading…</p>';
    let md;
    try {
      const res = await fetch(`lessons/${tid}/${lesson.file}`);
      if (!res.ok) throw new Error(res.status);
      md = await res.text();
    } catch {
      app.innerHTML = '<div class="empty">Couldn\'t load this lesson. Check your connection and try again.</div>';
      return;
    }
    const done = loadDone();
    const isDone = done.has(key(tid, lid));
    const next = t.lessons[idx + 1];
    const side = t.lessons.map((l, i) => {
      const cls = [l.id === lid ? "current" : "", done.has(key(tid, l.id)) ? "done" : ""].join(" ");
      return `<a class="${cls}" href="#/lesson/${tid}/${l.id}"><span class="n">${done.has(key(tid, l.id)) ? "✓" : i + 1}</span>${esc(l.title)}</a>`;
    });
    app.innerHTML = `
      <div class="lesson-layout">
        <aside class="lesson-side"><h4>${esc(t.title)}</h4>${side.join("")}</aside>
        <div class="lesson-main">
          <p class="crumb"><a href="#/topic/${tid}">${esc(t.title)}</a>, lesson ${idx + 1} of ${t.lessons.length}</p>
          <article>${render(md)}</article>
          <button class="btn ${isDone ? "secondary" : ""}" id="done">${isDone ? "Completed (tap to undo)" : "Mark as complete"}</button>
          ${next ? `<a class="next" href="#/lesson/${tid}/${next.id}">Next: ${esc(next.title)}</a>` : `<a class="next" href="#/topic/${tid}">Back to ${esc(t.title)}</a>`}
        </div>
      </div>`;
    document.getElementById("done").onclick = () => {
      const s = loadDone();
      const k = key(tid, lid);
      s.has(k) ? s.delete(k) : s.add(k);
      saveDone(s);
      updateRing();
      lessonView(tid, lid);
    };
  }

  function notFound() {
    app.innerHTML = '<div class="empty">Page not found. <a href="#/">Go home</a></div>';
  }

  // ---- router ----
  async function route() {
    const [, view, a, b] = location.hash.split("/");
    back.hidden = !view;
    back.onclick = () => {
      if (view === "lesson") location.hash = `#/topic/${a}`;
      else location.hash = "#/";
    };
    if (view === "topic") topicView(a);
    else if (view === "lesson") await lessonView(a, b);
    else home();
    updateRing();
    window.scrollTo(0, 0);
  }

  async function init() {
    try {
      const res = await fetch("topics.json");
      topics = (await res.json()).topics;
    } catch {
      app.innerHTML = '<div class="empty">Couldn\'t load topics. Check your connection and reload.</div>';
      return;
    }
    window.addEventListener("hashchange", route);
    route();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
  init();
})();

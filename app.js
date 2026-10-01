(() => {
  const app = document.getElementById("app");
  const tree = document.getElementById("tree");
  const back = document.getElementById("back");
  const STORE = "learning-hub:done";

  let topics = [];
  const expanded = new Set(); // topic ids open in the sidebar tree

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

  // ---- shared pieces ----
  function updateRing() {
    const done = loadDone();
    const total = topics.reduce((n, t) => n + t.lessons.length, 0);
    const finished = topics.reduce((n, t) => n + t.lessons.filter((l) => done.has(key(t.id, l.id))).length, 0);
    const pct = total ? Math.round((finished / total) * 100) : 0;
    document.querySelectorAll(".ring").forEach((el) => {
      el.style.setProperty("--p", pct);
      el.innerHTML = `<span>${pct}%</span>`;
    });
  }

  // The sidebar tree (desktop). Every destination is a row in it.
  function renderTree(activeTopic, activeLesson, focusTopic) {
    const done = loadDone();
    const branches = topics.map((t) => {
      const open = expanded.has(t.id);
      const n = t.lessons.filter((l) => done.has(key(t.id, l.id))).length;
      const lessons = t.lessons.map((l) => {
        const isDone = done.has(key(t.id, l.id));
        const current = t.id === activeTopic && l.id === activeLesson;
        return `<li><a class="node ${current ? "current" : ""} ${isDone ? "done" : ""}" href="#/lesson/${t.id}/${l.id}"${current ? ' aria-current="page"' : ""}>
          <span class="ico" aria-hidden="true">${isDone ? "✓" : ""}</span><span>${esc(l.title)}</span>
          ${isDone ? '<span class="sr">(completed)</span>' : ""}</a></li>`;
      }).join("");
      return `<li class="branch ${open ? "open" : ""}">
        <button class="node topic" type="button" data-topic="${t.id}" aria-expanded="${open}">
          <span class="caret" aria-hidden="true"></span><span>${esc(t.title)}</span>
          <span class="count">${n}/${t.lessons.length}</span>
        </button>
        <ul${open ? "" : " hidden"}>${lessons}</ul>
      </li>`;
    });
    tree.innerHTML = `
      <div class="tree-head"><a class="brand" href="#/">Learning Hub</a><div class="ring" aria-hidden="true"></div></div>
      <ul class="tree-list">${branches.join("") || '<li class="empty-tree">No topics yet.</li>'}</ul>`;
    tree.querySelectorAll("button.topic").forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.topic;
        expanded.has(id) ? expanded.delete(id) : expanded.add(id);
        renderTree(activeTopic, activeLesson, id);
      };
    });
    if (focusTopic) {
      const b = tree.querySelector(`button.topic[data-topic="${focusTopic}"]`);
      if (b) b.focus();
    }
  }

  // The first lesson not yet completed, for the "Continue" button.
  function nextUp() {
    const done = loadDone();
    for (const t of topics) {
      for (const l of t.lessons) {
        if (!done.has(key(t.id, l.id))) return { t, l, started: done.size > 0 };
      }
    }
    return null;
  }
  const continueButton = () => {
    const n = nextUp();
    if (!n) return "";
    return `<a class="btn auto" href="#/lesson/${n.t.id}/${n.l.id}">${n.started ? "Continue" : "Start"}: ${esc(n.l.title)}</a>`;
  };

  // ---- views ----
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
      <section class="hero">
        <h1>Learning Hub</h1>
        <p>Your personal library of lessons, built one topic at a time.</p>
        ${continueButton()}
      </section>
      <div class="index">${rows.join("") || '<div class="empty">No topics yet.</div>'}</div>
      <p class="footer-note">Progress is saved on this device.</p>`;
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
    app.innerHTML = `
      <div class="lesson-main">
        <p class="crumb"><a href="#/topic/${tid}">${esc(t.title)}</a>, lesson ${idx + 1} of ${t.lessons.length}</p>
        <article>${render(md)}</article>
        <div class="actions">
          <button class="btn auto ${isDone ? "secondary" : ""}" id="done">${isDone ? "Completed (tap to undo)" : "Mark as complete"}</button>
          ${next
            ? `<a class="btn auto secondary" href="#/lesson/${tid}/${next.id}">Next lesson</a>`
            : `<a class="btn auto secondary" href="#/topic/${tid}">Back to ${esc(t.title)}</a>`}
        </div>
      </div>`;
    document.getElementById("done").onclick = () => {
      const s = loadDone();
      const k = key(tid, lid);
      s.has(k) ? s.delete(k) : s.add(k);
      saveDone(s);
      renderTree(tid, lid);
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
    if (view === "topic" || view === "lesson") expanded.add(a);
    renderTree(view === "topic" || view === "lesson" ? a : null, view === "lesson" ? b : null);
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

/** Paginile de administrare, randate pe server. Nu ajunge nimic din ele în bundle-ul public. */

import { createHash } from 'node:crypto'
import { STATUSES } from './db.mjs'

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const STYLE = `
  :root { color-scheme: light dark; --paper:#f1eee7; --ink:#1b1c1a; --muted:#5c5b54;
    --rule:#cbc7bc; --raised:#f8f6f1; --accent:#b3341f; }
  @media (prefers-color-scheme: dark) { :root { --paper:#0c1524; --ink:#e9eef7;
    --muted:#a6b5cd; --rule:#22304a; --raised:#121e33; --accent:#f4926a; } }
  * { box-sizing:border-box; margin:0 }
  body { background:var(--paper); color:var(--ink); font:15px/1.6 ui-sans-serif,system-ui,sans-serif;
    padding:2rem 1.25rem 4rem }
  .wrap { overflow-wrap:anywhere; max-width:70rem; margin-inline:auto }
  header { display:flex; flex-wrap:wrap; gap:1rem; justify-content:space-between;
    align-items:center; padding-bottom:1rem; border-bottom:1px solid var(--rule); margin-bottom:2rem }
  h1 { font-size:1.4rem; letter-spacing:-.03em }
  h2 { font-size:1.05rem; letter-spacing:-.02em; margin-bottom:.5rem }
  a { color:var(--accent) }
  .muted { color:var(--muted); font-size:.82rem }
  .mono { font-family:ui-monospace,Menlo,Consolas,monospace; font-size:.75rem; color:var(--muted) }
  form.inline { display:inline }
  button, .btn { font:inherit; font-size:.8rem; font-weight:600; padding:.45rem .8rem;
    border:1px solid var(--rule); border-radius:6px; background:var(--raised); color:var(--ink);
    cursor:pointer; text-decoration:none; display:inline-block }
  button:hover { border-color:var(--ink) }
  button.danger { color:#a3221a; border-color:#d8b3ae }
  @media (prefers-color-scheme: dark) { button.danger { color:#ffb4ab; border-color:#98625c } }
  button.primary { background:var(--accent); border-color:var(--accent); color:#fff }
  @media (prefers-color-scheme: dark) { button.primary { color:#0c1524 } }
  .card { border:1px solid var(--rule); border-radius:12px; background:var(--raised);
    padding:1.25rem; margin-bottom:1rem }
  .card.unread { border-left:4px solid var(--accent) }
  .meta { display:flex; flex-wrap:wrap; gap:.35rem 1rem; margin:.35rem 0 .9rem }
  .body { white-space:pre-wrap; overflow-wrap:anywhere; padding:.9rem 1rem; border-radius:8px;
    background:var(--paper); border:1px solid var(--rule) }
  .actions { display:flex; flex-wrap:wrap; gap:.5rem; margin-top:.9rem }
  .mail-status { margin-top:1rem; padding-top:.8rem; border-top:1px solid var(--rule) }
  .mail-status h3 { font-size:.85rem; margin-bottom:.4rem }
  .mail-status ul { padding-left:1.2rem; overflow-wrap:anywhere }
  .mail-status li + li { margin-top:.4rem }
  label { display:block; font-size:.8rem; font-weight:600; margin-bottom:.35rem }
  select { font:inherit; font-size:.8rem; padding:.4rem; border:1px solid var(--rule);
    border-radius:6px; background:var(--raised); color:var(--ink) }
  input { width:100%; padding:.7rem .8rem; font:inherit; border:1px solid var(--rule);
    border-radius:6px; background:var(--paper); color:var(--ink) }
  .login { max-width:22rem; margin:12vh auto 0 }
  .error { margin-top:1rem; padding:.7rem .9rem; border-radius:6px; font-size:.85rem;
    border:1px solid #d8b3ae; background:#f9e7e5; color:#7d2018 }
  .warn { margin-bottom:1.5rem; padding:.7rem .9rem; border-radius:6px; font-size:.82rem;
    border:1px solid #d9b46a; background:#f7edd4; color:#6e5527 }
  .empty { padding:3rem 1rem; text-align:center; color:var(--muted) }
  .ok { margin-bottom:1rem; padding:.7rem .9rem; border-radius:6px; font-size:.85rem;
    border:1px solid #9fc5ae; background:#e8f3ec; color:#1f5e3d }
  .facts { display:grid; grid-template-columns:repeat(auto-fit,minmax(9rem,1fr)); gap:1px;
    background:var(--rule); border:1px solid var(--rule); border-radius:12px; overflow:hidden }
  .facts > div { background:var(--raised); padding:1rem }
  .facts span { display:block; font-size:.68rem; letter-spacing:.08em; text-transform:uppercase;
    color:var(--muted); margin-bottom:.35rem }
  .facts strong { font-size:.95rem }
`

/**
 * Confirmarea la ștergere. Stă într-un `<script>` cu hash, nu într-un atribut
 * `onsubmit`: atributele inline ar cere `script-src 'unsafe-inline'`, adică
 * exact permisiunea care face inutilă politica de securitate a conținutului.
 */
const SCRIPT = `
  document.addEventListener('submit', function (event) {
    var message = event.target.dataset.confirm
    if (message && !window.confirm(message)) event.preventDefault()
  })
`

const sha256 = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`

/**
 * Sursele permise pe paginile randate aici. `style-src` păstrează
 * `'unsafe-inline'` fiindcă paginile folosesc atribute `style`; `script-src`
 * acceptă doar scriptul de mai sus, după hash.
 */
export const CSP = [
  "default-src 'self'",
  `script-src ${sha256(SCRIPT)}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

export function shell(title, body, lang = 'ro') {
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escapeHtml(title)}</title><style>${STYLE}</style></head>
<body>${body}<script>${SCRIPT}</script></body></html>`
}

function formatDate(iso) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('ro-RO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Bucharest',
  }).format(date)
}

function notificationStatus(job) {
  if (job.status === 'sent') return `Acceptat de SMTP · ${formatDate(job.sent_at)}`
  if (job.status === 'sending') return `În curs de expediere · încercarea ${job.attempts}`
  if (job.status === 'failed') return `Necesită intervenție · ${job.attempts} încercări`
  return job.attempts
    ? `Reîncercare programată: ${formatDate(job.next_attempt_at)} · ${job.attempts} încercări efectuate`
    : 'În așteptare'
}

function notificationsPanel(row) {
  const jobs = row.notifications ?? []
  if (!jobs.length) return '<p class="muted mail-status">Notificări e-mail: fără istoric de livrare pentru acest mesaj.</p>'
  return `<section class="mail-status" aria-label="Notificări pentru mesajul ${row.id}">
    <h3>Notificări e-mail</h3>
    <ul class="muted">${jobs.map((job) => `<li><strong>${job.kind === 'admin' ? 'Administrator' : 'Confirmare vizitator'}</strong>:
      ${escapeHtml(notificationStatus(job))}
      ${job.last_error ? `<br>${escapeHtml(job.last_error)}` : ''}</li>`).join('')}</ul>
    ${jobs.some((job) => job.status === 'failed') ? `<form method="post" action="/admin/messages/${row.id}/retry-mail" style="margin-top:.7rem">
      <button type="submit">Reîncearcă notificările eșuate</button></form>` : ''}
  </section>`
}

export function messagesPage(rows, { insecure, mailConfigured = true } = {}) {
  const unread = rows.filter((row) => !row.read_at).length

  const cards = rows
    .map(
      (row) => `
      <article class="card${row.read_at ? '' : ' unread'}">
        <h2>${escapeHtml(row.name)}${row.organisation ? ` · ${escapeHtml(row.organisation)}` : ''}</h2>
        <div class="meta">
          <span class="mono">#${row.id}</span>
          <span class="mono">${escapeHtml(formatDate(row.created_at))}</span>
          <a href="mailto:${escapeHtml(row.email)}">${escapeHtml(row.email)}</a>
          ${row.topic ? `<span class="muted">${escapeHtml(row.topic)}</span>` : ''}
          <span class="muted">stare: <strong>${escapeHtml(row.status ?? 'primit')}</strong></span>
          ${row.owner_email ? `<span class="muted">cont: ${escapeHtml(row.owner_email)}</span>` : '<span class="muted">fără cont</span>'}
          ${row.read_at ? '<span class="muted">citit</span>' : '<span class="muted"><strong>necitit</strong></span>'}
        </div>
        <div class="body">${escapeHtml(row.message)}</div>
        ${notificationsPanel(row)}
        <div class="actions">
          ${
            row.read_at
              ? ''
              : `<form class="inline" method="post" action="/admin/messages/${row.id}/read">
                   <button type="submit">Marchează citit</button></form>`
          }
          <form class="inline" method="post" action="/admin/messages/${row.id}/status">
            <select name="status" aria-label="Stare pentru mesajul ${row.id}">
              ${STATUSES.map((value) => `<option value="${value}"${(row.status ?? 'primit') === value ? ' selected' : ''}>${value}</option>`).join('')}
            </select>
            <button type="submit">Salvează starea</button></form>
          <form class="inline" method="post" action="/admin/messages/${row.id}/delete"
                data-confirm="Ștergeți definitiv mesajul #${row.id}?">
            <button class="danger" type="submit">Șterge</button></form>
        </div>
      </article>`,
    )
    .join('')

  return shell(
    'Mesaje · Administrare',
    `<div class="wrap">
      <header>
        <div>
          <h1>Mesaje din formularul de contact</h1>
          <p class="muted">${rows.length} în total · ${unread} necitite</p>
        </div>
        <div style="display:flex;gap:.5rem">
          <a class="btn" href="/cont">Contul meu</a><a class="btn" href="/admin/health">Starea serviciilor</a>
          <a class="btn" href="/admin/export.csv">Export CSV</a>
          <form class="inline" method="post" action="/admin/logout"><button type="submit">Ieși</button></form>
        </div>
      </header>
      ${insecure ? '<p class="warn"><strong>Conexiune necriptată.</strong> Datele de pe această pagină circulă în clar. Activați HTTPS pentru acces din afara serverului.</p>' : ''}
      ${!mailConfigured ? '<p class="warn"><strong>SMTP neconfigurat.</strong> Notificările sunt păstrate în coadă. Expedierea începe după configurarea SMTP și repornirea serviciului.</p>' : ''}
      <p class="muted" style="margin-bottom:1rem">Starea „Acceptat de SMTP” confirmă predarea către serverul de e-mail, nu sosirea în Inbox. Fiecare notificare are maximum 6 încercări automate de expediere.</p>
      ${rows.length ? cards : '<p class="empty">Niciun mesaj primit încă.</p>'}
    </div>`,
  )
}

export function csv(rows) {
  /**
   * Ghilimelele se dublează, iar celulele care încep cu `= + - @` (sau cu tab /
   * retur de car, pe care Excel le ignoră înainte de a citi formula) primesc un
   * apostrof. Altfel un mesaj scris de un vizitator anonim, de forma
   * `=HYPERLINK(...)`, s-ar executa când administratorul deschide exportul.
   */
  const cell = (value) => {
    const text = String(value ?? '')
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
    return `"${safe.replaceAll('"', '""')}"`
  }
  const header = ['id', 'data', 'nume', 'email', 'organizatie', 'subiect', 'mesaj', 'citit_la']
  const lines = rows.map((row) =>
    [
      row.id,
      row.created_at,
      row.name,
      row.email,
      row.organisation,
      row.topic,
      row.message,
      row.read_at ?? '',
    ]
      .map(cell)
      .join(','),
  )
  return `﻿${header.map(cell).join(',')}\n${lines.join('\n')}\n`
}

/* =========================================================
   MUNDIAL MANAGER · Interfaz
   Un solo archivo compartido por:
     - index.html                 (panel de administración, data-page="app")
     - Club/listar.html, etc.     (listados,   data-page="list")
     - Club/formulario.html, etc. (formularios, data-page="form")
   Solo consume los endpoints REST existentes: /api/...
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     Utilidades
     --------------------------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const fullName = x => [x?.nombre, x?.apellido].filter(Boolean).join(' ');
  const initials = name => String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function isoDate(v) {
    if (Array.isArray(v)) v = v.map((n, i) => (i ? String(n).padStart(2, '0') : n)).join('-');
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v ?? ''));
    return m ? m[0] : '';
  }
  function fmtDate(v) {
    const iso = isoDate(v);
    if (!iso) return v ? String(v) : '—';
    const [y, m, d] = iso.split('-');
    return `${+d} ${MONTHS[+m - 1]} ${y}`;
  }
  const money = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);
  function todayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function compStatus(c) {
    const t = todayIso(), a = isoDate(c.fechaInicio), b = isoDate(c.fechaFin);
    if (!a || !b) return { label: '—', cls: 'neutral' };
    if (t < a) return { label: 'Programada', cls: 'warn' };
    if (t > b) return { label: 'Finalizada', cls: 'neutral' };
    return { label: 'En curso', cls: '' };
  }

  /* ---------------------------------------------------------
     Iconos (trazo lineal, sin emojis)
     --------------------------------------------------------- */
  const ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="1"/><path d="M9 4h6v3H9z"/><path d="M8.5 12h7M8.5 16h5"/>',
    columns: '<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/>',
    trophy: '<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    alert: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h.01"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4M4 5v4h4"/><path d="M4 13a8 8 0 0 0 14 4M20 19v-4h-4"/>',
    empty: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 10h18M9 10v9"/>'
  };
  const icon = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  /* ---------------------------------------------------------
     Cliente de la API REST (misma lógica que la versión anterior)
     --------------------------------------------------------- */
  async function api(url, options = {}) {
    let r;
    try {
      r = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
    } catch (e) {
      throw new Error('No se pudo conectar con el servidor.');
    }
    const text = await r.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!r.ok) {
      const err = new Error(data?.mensaje || data?.message || data?.error || 'Ocurrió un error.');
      err.status = r.status;
      err.title = data?.error;
      err.details = data?.detalles;
      throw err;
    }
    return data;
  }

  /* ---------------------------------------------------------
     Estado y carga de datos
     --------------------------------------------------------- */
  const S = { clubes: [], jugadores: [], entrenadores: [], asociaciones: [], competiciones: [] };
  const KEYS = Object.keys(S);
  const loadErrors = {};

  async function load(keys) {
    const failed = [];
    await Promise.all(keys.map(async k => {
      try {
        const d = await api('/api/' + k);
        S[k] = Array.isArray(d) ? d : [];
        delete loadErrors[k];
      } catch (e) {
        console.error(k, e);
        S[k] = [];
        loadErrors[k] = e.message;
        failed.push(k);
      }
    }));
    return failed;
  }

  const byId = (k, id) => S[k].find(x => x.id === id);
  const coachName = id => { const x = byId('entrenadores', id); return x ? fullName(x) : null; };
  const clubName = id => byId('clubes', id)?.nombre || null;
  const assocName = id => byId('asociaciones', id)?.nombre || null;
  const clubOfCoach = id => S.clubes.find(c => c.entrenadorId === id);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  /* ---------------------------------------------------------
     Configuración de cada recurso (columnas, formularios, textos)
     --------------------------------------------------------- */
  const R = {
    clubes: {
      key: 'clubes', plural: 'Clubes', singular: 'club', icon: 'shield',
      listUrl: '/Club/listar', formUrl: '/Club/formulario',
      desc: 'Administra clubes y sus relaciones con jugadores, entrenadores, asociaciones y competiciones.',
      formDesc: 'El club debe tener entrenador, asociación, jugadores y al menos una competición.',
      newLabel: 'Nuevo club', newTitle: 'Nuevo club', editTitle: 'Editar club', saveLabel: 'Guardar club',
      search: 'Buscar club...', loadError: 'No se pudieron consultar los clubes.', notFound: 'No se encontró el club.',
      emptyText: 'No hay clubes registrados.', created: 'Club creado correctamente.', updated: 'Club actualizado correctamente.', deleted: 'Club eliminado correctamente.',
      deps: ['clubes', 'entrenadores', 'asociaciones', 'jugadores', 'competiciones'],
      title: x => x.nombre, wide: true,
      searchText: c => [c.nombre, c.ciudad, c.estadio, coachName(c.entrenadorId), assocName(c.asociacionId)].join(' '),
      columns: [
        { label: 'Club', sort: c => c.nombre, render: c => `<div class="cell-main"><span class="monogram">${esc(initials(c.nombre))}</span><div><div class="cell-title">${esc(c.nombre)}</div><div class="cell-sub">${esc(assocName(c.asociacionId) || 'Sin asociación')}</div></div></div>` },
        { label: 'Ciudad', sort: c => c.ciudad, render: c => esc(c.ciudad) },
        { label: 'Estadio', sort: c => c.estadio, render: c => esc(c.estadio) },
        { label: 'Entrenador', sort: c => coachName(c.entrenadorId) || '', render: c => { const n = coachName(c.entrenadorId); return n ? esc(n) : '<span class="tag neutral">Sin asignar</span>'; } },
        { label: 'Jugadores', sort: c => (c.jugadoresIds || []).length, render: c => `<span class="tag num">${(c.jugadoresIds || []).length}</span>` }
      ],
      rules: [
        'Nombre, ciudad y estadio son obligatorios.',
        'Cada club tiene un entrenador y una asociación.',
        'Debe tener al menos un jugador. Los jugadores de otro club no se pueden seleccionar.',
        'Debe participar en al menos una competición.',
        'Los conflictos de relaciones se rechazan con un error 409 y no se guardan.'
      ],
      sections: [
        { title: 'Datos generales', fields: [
          { name: 'nombre', label: 'Nombre', required: true },
          { name: 'ciudad', label: 'Ciudad', required: true },
          { name: 'estadio', label: 'Estadio', required: true, full: true }
        ] },
        { title: 'Cuerpo técnico y afiliación', fields: [
          { name: 'entrenadorId', label: 'Entrenador', type: 'select', required: true, hint: 'Solo se listan entrenadores sin club asignado.',
            options: item => S.entrenadores.filter(e => !S.clubes.some(c => c.entrenadorId === e.id) || e.id === item?.entrenadorId).map(e => ({ value: e.id, label: fullName(e) })) },
          { name: 'asociacionId', label: 'Asociación', type: 'select', required: true,
            options: () => S.asociaciones.map(a => ({ value: a.id, label: a.nombre + ' · ' + a.pais })) }
        ] },
        { title: 'Plantilla', fields: [
          { name: 'jugadoresIds', label: 'Jugadores', type: 'picklist', required: true, full: true, noun: 'un jugador',
            hint: 'El club debe tener al menos un jugador. Los jugadores de otro club no se pueden seleccionar.', empty: 'No hay jugadores disponibles.',
            options: item => {
              const cur = item?.jugadoresIds || [];
              return S.jugadores.filter(j => !j.clubId || cur.includes(j.id)).map(j => ({ value: j.id, label: fullName(j), sub: '#' + j.numero + ' · ' + j.posicion + (j.clubId ? '' : ' · Libre') }));
            } }
        ] },
        { title: 'Competiciones', fields: [
          { name: 'competicionesIds', label: 'Competiciones', type: 'picklist', required: true, full: true, noun: 'una competición',
            hint: 'Puede seleccionar varias.', empty: 'No hay competiciones registradas.',
            options: () => S.competiciones.map(c => ({ value: c.id, label: c.nombre, sub: fmtDate(c.fechaInicio) + ' – ' + fmtDate(c.fechaFin) })) }
        ] }
      ]
    },

    jugadores: {
      key: 'jugadores', plural: 'Jugadores', singular: 'jugador', icon: 'user',
      listUrl: '/Jugador/listar', formUrl: '/Jugador/formulario',
      desc: 'Consulta y administra los jugadores y su club.',
      formDesc: 'El jugador debe pertenecer a un club existente.',
      newLabel: 'Nuevo jugador', newTitle: 'Nuevo jugador', editTitle: 'Editar jugador', saveLabel: 'Guardar',
      search: 'Buscar jugador...', loadError: 'No se pudieron consultar los jugadores.', notFound: 'No se encontró el jugador.',
      emptyText: 'No hay jugadores registrados.', created: 'Jugador creado correctamente.', updated: 'Jugador actualizado correctamente.', deleted: 'Jugador eliminado correctamente.',
      deps: ['jugadores', 'clubes'],
      title: x => fullName(x),
      searchText: j => [fullName(j), j.posicion, j.numero, clubName(j.clubId)].join(' '),
      columns: [
        { label: 'Jugador', sort: j => fullName(j), render: j => `<div class="cell-main"><span class="monogram alt">${esc(initials(fullName(j)))}</span><div class="cell-title">${esc(fullName(j))}</div></div>` },
        { label: 'Número', sort: j => Number(j.numero), render: j => `<span class="shirt">${esc(j.numero)}</span>` },
        { label: 'Posición', sort: j => j.posicion, render: j => `<span class="tag neutral">${esc(j.posicion)}</span>` },
        { label: 'Club', sort: j => clubName(j.clubId) || '', render: j => { const n = clubName(j.clubId); return n ? esc(n) : '<span class="tag neutral">Sin club</span>'; } }
      ],
      rules: ['Nombre, apellido y posición son obligatorios.', 'El número debe estar entre 1 y 99.', 'La API exige un club existente.'],
      sections: [
        { title: 'Datos del jugador', fields: [
          { name: 'nombre', label: 'Nombre', required: true },
          { name: 'apellido', label: 'Apellido', required: true },
          { name: 'numero', label: 'Número (1–99)', type: 'number', required: true, min: 1, max: 99 },
          { name: 'posicion', label: 'Posición', required: true }
        ] },
        { title: 'Club', fields: [
          { name: 'clubId', label: 'Club', type: 'select', required: true, full: true, hint: 'La API exige un club existente.',
            options: () => S.clubes.map(c => ({ value: c.id, label: c.nombre })) }
        ] }
      ]
    },

    entrenadores: {
      key: 'entrenadores', plural: 'Entrenadores', singular: 'entrenador', icon: 'clipboard',
      listUrl: '/Entrenador/listar', formUrl: '/Entrenador/formulario',
      desc: 'Consulta y administra los entrenadores.',
      formDesc: 'Los datos se guardan usando la API REST.',
      newLabel: 'Nuevo entrenador', newTitle: 'Nuevo entrenador', editTitle: 'Editar entrenador', saveLabel: 'Guardar',
      search: 'Buscar entrenador...', loadError: 'No se pudieron consultar los entrenadores.', notFound: 'No se encontró el entrenador.',
      emptyText: 'No hay entrenadores registrados.', created: 'Entrenador creado correctamente.', updated: 'Entrenador actualizado correctamente.', deleted: 'Entrenador eliminado correctamente.',
      deps: ['entrenadores', 'clubes'],
      title: x => fullName(x),
      searchText: e => [fullName(e), e.nacionalidad, clubOfCoach(e.id)?.nombre].join(' '),
      columns: [
        { label: 'Nombre', sort: e => fullName(e), render: e => `<div class="cell-main"><span class="monogram alt">${esc(initials(fullName(e)))}</span><div class="cell-title">${esc(fullName(e))}</div></div>` },
        { label: 'Edad', sort: e => Number(e.edad), render: e => `<span class="num">${esc(e.edad)}</span>` },
        { label: 'Nacionalidad', sort: e => e.nacionalidad, render: e => esc(e.nacionalidad) },
        { label: 'Club', sort: e => clubOfCoach(e.id)?.nombre || '', render: e => { const c = clubOfCoach(e.id); return c ? esc(c.nombre) : '<span class="tag neutral">Libre</span>'; } }
      ],
      rules: ['Todos los campos son obligatorios.', 'La edad debe estar entre 18 y 100 años.', 'El club se asigna desde el formulario del club.'],
      sections: [
        { title: 'Datos del entrenador', fields: [
          { name: 'nombre', label: 'Nombre', required: true },
          { name: 'apellido', label: 'Apellido', required: true },
          { name: 'edad', label: 'Edad (18–100)', type: 'number', required: true, min: 18, max: 100 },
          { name: 'nacionalidad', label: 'Nacionalidad', required: true }
        ] }
      ]
    },

    asociaciones: {
      key: 'asociaciones', plural: 'Asociaciones', singular: 'asociación', icon: 'columns',
      listUrl: '/Asociacion/listar', formUrl: '/Asociacion/formulario',
      desc: 'Consulta y administra las asociaciones registradas.',
      formDesc: 'Los datos se guardan usando la API REST.',
      newLabel: 'Nueva asociación', newTitle: 'Nueva asociación', editTitle: 'Editar asociación', saveLabel: 'Guardar',
      search: 'Buscar asociación...', loadError: 'No se pudieron consultar las asociaciones.', notFound: 'No se encontró la asociación.',
      emptyText: 'No hay asociaciones registradas.', created: 'Asociación creada correctamente.', updated: 'Asociación actualizada correctamente.', deleted: 'Asociación eliminada correctamente.',
      deps: ['asociaciones', 'clubes'],
      title: x => x.nombre,
      searchText: a => [a.nombre, a.pais, a.presidente].join(' '),
      columns: [
        { label: 'Nombre', sort: a => a.nombre, render: a => `<div class="cell-main"><span class="monogram gold">${esc(initials(a.nombre))}</span><div class="cell-title">${esc(a.nombre)}</div></div>` },
        { label: 'País', sort: a => a.pais, render: a => esc(a.pais) },
        { label: 'Presidente', sort: a => a.presidente, render: a => esc(a.presidente) },
        { label: 'Clubes', sort: a => S.clubes.filter(c => c.asociacionId === a.id).length, render: a => `<span class="tag num">${S.clubes.filter(c => c.asociacionId === a.id).length}</span>` }
      ],
      rules: ['Nombre, país y presidente son obligatorios.', 'Los clubes se vinculan a una asociación desde el formulario del club.'],
      sections: [
        { title: 'Datos de la asociación', fields: [
          { name: 'nombre', label: 'Nombre', required: true, full: true },
          { name: 'pais', label: 'País', required: true },
          { name: 'presidente', label: 'Presidente', required: true }
        ] }
      ]
    },

    competiciones: {
      key: 'competiciones', plural: 'Competiciones', singular: 'competición', icon: 'trophy',
      listUrl: '/Competicion/listar', formUrl: '/Competicion/formulario',
      desc: 'Consulta y administra las competiciones.',
      formDesc: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
      newLabel: 'Nueva competición', newTitle: 'Nueva competición', editTitle: 'Editar competición', saveLabel: 'Guardar',
      search: 'Buscar competición...', loadError: 'No se pudieron consultar las competiciones.', notFound: 'No se encontró la competición.',
      emptyText: 'No hay competiciones registradas.', created: 'Competición creada correctamente.', updated: 'Competición actualizada correctamente.', deleted: 'Competición eliminada correctamente.',
      deps: ['competiciones', 'clubes'],
      title: x => x.nombre,
      searchText: c => [c.nombre, c.fechaInicio, c.fechaFin].join(' '),
      columns: [
        { label: 'Nombre', sort: c => c.nombre, render: c => `<div class="cell-main"><span class="monogram gold">${icon('trophy')}</span><div class="cell-title">${esc(c.nombre)}</div></div>` },
        { label: 'Premio', cls: 'right', sort: c => Number(c.montoPremio), render: c => `<span class="num">${money(c.montoPremio)}</span>` },
        { label: 'Inicio', sort: c => isoDate(c.fechaInicio), render: c => esc(fmtDate(c.fechaInicio)) },
        { label: 'Fin', sort: c => isoDate(c.fechaFin), render: c => esc(fmtDate(c.fechaFin)) },
        { label: 'Estado', sort: c => compStatus(c).label, render: c => { const s = compStatus(c); return `<span class="tag ${s.cls}">${s.label}</span>`; } },
        { label: 'Clubes', sort: c => S.clubes.filter(k => (k.competicionesIds || []).includes(c.id)).length, render: c => `<span class="tag num">${S.clubes.filter(k => (k.competicionesIds || []).includes(c.id)).length}</span>` }
      ],
      rules: ['Nombre, premio y fechas son obligatorios.', 'El monto del premio debe ser mayor que cero.', 'La fecha de fin no puede ser anterior a la fecha de inicio.'],
      validate: b => (b.fechaInicio && b.fechaFin && b.fechaFin < b.fechaInicio) ? { fechaFin: 'La fecha de fin no puede ser anterior a la fecha de inicio.' } : null,
      sections: [
        { title: 'Datos de la competición', fields: [
          { name: 'nombre', label: 'Nombre', required: true, full: true },
          { name: 'montoPremio', label: 'Monto del premio', type: 'number', required: true, min: 1 }
        ] },
        { title: 'Calendario', fields: [
          { name: 'fechaInicio', label: 'Fecha de inicio', type: 'date', required: true },
          { name: 'fechaFin', label: 'Fecha de fin', type: 'date', required: true }
        ] }
      ]
    }
  };

  /* ---------------------------------------------------------
     Estructura general (barra lateral, barra superior, pie)
     --------------------------------------------------------- */
  const NAV = [
    { key: 'inicio', label: 'Inicio', icon: 'home', href: '/' },
    { key: 'clubes', label: 'Clubes', icon: 'shield' },
    { key: 'jugadores', label: 'Jugadores', icon: 'user' },
    { key: 'entrenadores', label: 'Entrenadores', icon: 'clipboard' },
    { key: 'asociaciones', label: 'Asociaciones', icon: 'columns' },
    { key: 'competiciones', label: 'Competiciones', icon: 'trophy' }
  ];

  function buildShell(active, spa) {
    const links = NAV.map(n => {
      const href = spa ? '#' + n.key : (n.href || R[n.key].listUrl);
      return `<a href="${href}" data-nav="${n.key}" ${n.key === active ? 'class="active" aria-current="page"' : ''}>${icon(n.icon)}<span>${n.label}</span><span class="count" data-count="${n.key}"></span></a>`;
    }).join('');
    $('#root').innerHTML = `
      <div class="app">
        <aside class="sidebar" id="sidebar" aria-label="Navegación principal">
          <a class="brand" href="${spa ? '#inicio' : '/'}">
            <span class="brand-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14"/><path d="M12 5v14"/><circle cx="12" cy="12" r="3"/></svg></span>
            <span><span class="brand-name">Mundial Manager</span><span class="brand-sub" style="display:block">API REST · MongoDB</span></span>
          </a>
          <div class="nav-label">Gestión</div>
          <nav class="nav">${links}</nav>
          <div class="sidebar-foot">
            <a href="/api" target="_blank" rel="noopener">${icon('external')} Ver API JSON</a>
            <div>Sistema de Gestión del Mundial</div>
          </div>
        </aside>
        <div class="scrim" id="scrim"></div>
        <div class="content">
          <header class="topbar">
            <button class="menu-btn" id="menu-btn" aria-label="Abrir menú" aria-controls="sidebar">${icon('menu')}</button>
            <nav class="crumbs" id="crumbs" aria-label="Ruta"></nav>
            <div class="topbar-actions"><a class="btn btn-secondary btn-sm" href="/api" target="_blank" rel="noopener">${icon('external')} API JSON</a></div>
          </header>
          <main class="page" id="page" tabindex="-1"></main>
          <footer class="footer"><span>Mundial Manager · Interfaz conectada a la API REST</span><span>Endpoints: /api/clubes · /api/jugadores · /api/entrenadores · /api/asociaciones · /api/competiciones</span></footer>
        </div>
      </div>
      <div class="toasts" id="toasts" aria-live="polite"></div>`;

    const sb = $('#sidebar'), sc = $('#scrim');
    const close = () => { sb.classList.remove('open'); sc.classList.remove('show'); };
    $('#menu-btn').onclick = () => { sb.classList.add('open'); sc.classList.add('show'); };
    sc.onclick = close;
    sb.addEventListener('click', e => { if (e.target.closest('.nav a')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  function setCrumbs(items) {
    $('#crumbs').innerHTML = items.map((c, i) => {
      const last = i === items.length - 1;
      const part = last ? `<span class="here">${esc(c.label)}</span>` : `<a href="${c.href}">${esc(c.label)}</a>`;
      return part + (last ? '' : '<span class="sep">/</span>');
    }).join('');
  }

  function setActiveNav(key) {
    $$('.nav a').forEach(a => {
      const on = a.dataset.nav === key;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function updateNavCounts() {
    KEYS.forEach(k => { const el = $(`[data-count="${k}"]`); if (el) el.textContent = S[k].length; });
  }

  function pageHead({ eyebrow, title, desc, actions = '' }) {
    return `<div class="page-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1>${desc ? `<p>${esc(desc)}</p>` : ''}</div>${actions ? `<div class="head-actions">${actions}</div>` : ''}</div>`;
  }

  /* ---------------------------------------------------------
     Avisos: alertas y toasts
     --------------------------------------------------------- */
  function setAlert(el, type, title, msg, extra = '') {
    if (!el) return;
    el.className = 'alert ' + type;
    el.innerHTML = `${icon(type === 'ok' ? 'check' : 'alert')}<div class="alert-body">${title ? `<strong>${esc(title)}</strong>` : ''}${esc(msg || '')}</div>${extra}`;
    el.hidden = false;
  }
  const alertHtml = (type, title, msg, extra = '') => `<div class="alert ${type}" role="alert">${icon(type === 'ok' ? 'check' : 'alert')}<div class="alert-body">${title ? `<strong>${esc(title)}</strong>` : ''}${esc(msg || '')}</div>${extra}</div>`;

  function toast(type, title, msg) {
    const box = $('#toasts');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.setAttribute('role', type === 'error' ? 'alert' : 'status');
    t.innerHTML = `<div class="t-body"><span class="t-title">${esc(title)}</span>${msg ? `<span class="t-msg">${esc(msg)}</span>` : ''}</div><button aria-label="Cerrar aviso">${icon('x')}</button>`;
    box.appendChild(t);
    const kill = () => t.remove();
    t.querySelector('button').onclick = kill;
    setTimeout(kill, type === 'error' ? 8000 : 3800);
  }

  function flash(type, title, msg) {
    try { sessionStorage.setItem('mundial-flash', JSON.stringify({ type, title, msg })); } catch (e) { /* sin almacenamiento */ }
  }
  function showFlash() {
    try {
      const raw = sessionStorage.getItem('mundial-flash');
      if (!raw) return;
      sessionStorage.removeItem('mundial-flash');
      const f = JSON.parse(raw);
      toast(f.type, f.title, f.msg);
    } catch (e) { /* ignorar */ }
  }

  /* ---------------------------------------------------------
     Diálogos
     --------------------------------------------------------- */
  function makeDialog({ title, body, foot, size = '', cls = '', backdrop = true }) {
    const d = document.createElement('dialog');
    d.className = `dialog ${size} ${cls}`.trim();
    d.innerHTML = `<div class="dialog-head"><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-close aria-label="Cerrar">${icon('x')}</button></div><div class="dialog-body">${body}</div>${foot ? `<div class="dialog-foot">${foot}</div>` : ''}`;
    document.body.appendChild(d);
    d.addEventListener('click', e => {
      if (e.target.closest('[data-close]')) d.close();
      else if (backdrop && e.target === d) d.close();
    });
    d.addEventListener('close', () => d.remove());
    d.showModal();
    return d;
  }

  function confirmDelete(cfg, item, done) {
    const d = makeDialog({
      title: 'Eliminar ' + cfg.singular, size: 'sm',
      body: `<div id="del-alert" hidden></div><p class="confirm-text">¿Seguro que deseas eliminar <b>${esc(cfg.title(item) || 'este registro')}</b>? Esta acción no se puede deshacer.</p>`,
      foot: `<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="button" class="btn btn-danger-solid" id="del-ok">${icon('trash')} Eliminar</button>`
    });
    const ok = $('#del-ok', d);
    ok.onclick = async () => {
      setBusy(ok, true, 'Eliminando...');
      try {
        await api('/api/' + cfg.key + '/' + item.id, { method: 'DELETE' });
        d.close();
        toast('ok', 'Registro eliminado', cfg.deleted);
        await done();
      } catch (e) {
        setBusy(ok, false);
        setAlert($('#del-alert', d), 'error', 'No se pudo eliminar', e.message);
      }
    };
    ok.focus();
  }

  function setBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) {
      btn.dataset.html = btn.innerHTML;
      btn.innerHTML = `<span class="spinner"></span>${label ? ' ' + esc(label) : ''}`;
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      if (btn.dataset.html) btn.innerHTML = btn.dataset.html;
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  /* ---------------------------------------------------------
     Listados (tabla con búsqueda, orden y estados)
     --------------------------------------------------------- */
  const newControl = (cfg, mode, cls = 'btn btn-primary') =>
    mode === 'page'
      ? `<a class="${cls}" href="${cfg.formUrl}">${icon('plus')} ${cfg.newLabel}</a>`
      : `<button type="button" class="${cls}" data-act="new" data-res="${cfg.key}">${icon('plus')} ${cfg.newLabel}</button>`;

  const editControl = (cfg, id, mode) =>
    mode === 'page'
      ? `<a class="btn btn-secondary btn-sm" href="${cfg.formUrl}?id=${encodeURIComponent(id)}">${icon('edit')} Editar</a>`
      : `<button type="button" class="btn btn-secondary btn-sm" data-act="edit" data-res="${cfg.key}" data-id="${esc(id)}">${icon('edit')} Editar</button>`;

  function rowActions(cfg, x, mode) {
    return `<div class="row-actions">${cfg.key === 'clubes' ? `<button type="button" class="btn btn-secondary btn-sm" data-act="detail" data-id="${esc(x.id)}">${icon('eye')} Detalle</button>` : ''}${editControl(cfg, x.id, mode)}<button type="button" class="btn btn-danger btn-sm" data-act="delete" data-res="${cfg.key}" data-id="${esc(x.id)}">${icon('trash')} Eliminar</button></div>`;
  }

  function ListView(res, root, mode) {
    const cfg = R[res];
    let q = '', sortIdx = -1, dir = 1, status = 'loading', errMsg = '';

    root.innerHTML = `
      <div class="panel">
        <div class="toolbar">
          <label class="search">${icon('search')}<span class="sr-only">${esc(cfg.search)}</span><input type="search" placeholder="${esc(cfg.search)}" autocomplete="off"></label>
          <span class="result-count" aria-live="polite"></span>
        </div>
        <div class="table-wrap"><table class="table"><thead></thead><tbody></tbody></table></div>
        <div data-state></div>
      </div>`;
    const input = $('input', root), thead = $('thead', root), tbody = $('tbody', root), stateEl = $('[data-state]', root), count = $('.result-count', root);

    input.addEventListener('input', () => { q = input.value; render(); });
    thead.addEventListener('click', e => {
      const th = e.target.closest('th[data-sort]');
      if (!th) return;
      const i = +th.dataset.sort;
      if (sortIdx === i) dir = -dir; else { sortIdx = i; dir = 1; }
      render();
    });

    function rows() {
      let items = S[res].slice();
      if (q.trim()) { const nq = norm(q.trim()); items = items.filter(x => norm(cfg.searchText(x)).includes(nq)); }
      if (sortIdx >= 0) {
        const f = cfg.columns[sortIdx].sort;
        items.sort((a, b) => {
          const va = f(a), vb = f(b);
          const c = (typeof va === 'number' && typeof vb === 'number') ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'es', { numeric: true, sensitivity: 'base' });
          return c * dir;
        });
      }
      return items;
    }

    function render() {
      thead.innerHTML = '<tr>' + cfg.columns.map((c, i) => {
        const on = sortIdx === i;
        return `<th class="sortable ${c.cls || ''}" data-sort="${i}" aria-sort="${on ? (dir > 0 ? 'ascending' : 'descending') : 'none'}">${esc(c.label)}${on ? `<span class="arrow">${dir > 0 ? '▲' : '▼'}</span>` : ''}</th>`;
      }).join('') + '<th class="right">Acciones</th></tr>';
      const span = cfg.columns.length + 1;
      stateEl.innerHTML = '';
      count.innerHTML = '';

      if (status === 'loading') {
        tbody.innerHTML = Array.from({ length: 5 }, () => '<tr>' + Array.from({ length: span }, () => '<td><span class="skeleton"></span></td>').join('') + '</tr>').join('');
        return;
      }
      if (status === 'error') {
        tbody.innerHTML = '';
        stateEl.innerHTML = `<div class="state"><div class="state-icon">${icon('alert')}</div><h3>No se pudo cargar</h3><p>${esc(errMsg)}</p><button type="button" class="btn btn-secondary" data-act="retry">${icon('refresh')} Reintentar</button></div>`;
        return;
      }
      const items = rows();
      count.innerHTML = `<b>${items.length}</b> de ${S[res].length} ${S[res].length === 1 ? 'registro' : 'registros'}`;
      if (!items.length) {
        tbody.innerHTML = '';
        stateEl.innerHTML = S[res].length
          ? `<div class="state"><div class="state-icon">${icon('search')}</div><h3>Sin resultados</h3><p>Ningún registro coincide con «${esc(q.trim())}».</p></div>`
          : `<div class="state"><div class="state-icon">${icon('empty')}</div><h3>${esc(cfg.emptyText)}</h3><p>Crea el primer registro para empezar.</p>${newControl(cfg, mode)}</div>`;
        return;
      }
      tbody.innerHTML = items.map(x => '<tr>' + cfg.columns.map(c => `<td class="${c.cls || ''}">${c.render(x)}</td>`).join('') + `<td>${rowActions(cfg, x, mode)}</td></tr>`).join('');
    }

    render();
    return {
      loading() { status = 'loading'; render(); },
      error(msg) { status = 'error'; errMsg = msg; render(); },
      ready() { status = 'ready'; render(); }
    };
  }

  /* ---------------------------------------------------------
     Formularios
     --------------------------------------------------------- */
  function fieldHtml(f, item) {
    const id = 'f_' + f.name;
    const req = f.required ? '<span class="req" aria-hidden="true">*</span>' : '';
    let control = '', labelTag;
    if (f.type === 'select') {
      const cur = String(item?.[f.name] ?? '');
      control = `<select id="${id}" name="${f.name}" ${f.required ? 'required' : ''}><option value="">Seleccione...</option>${f.options(item).map(o => `<option value="${esc(o.value)}" ${o.value === cur ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
      labelTag = `<label for="${id}">${esc(f.label)}${req}</label>`;
    } else if (f.type === 'picklist') {
      const sel = new Set(item?.[f.name] || []);
      const opts = f.options(item);
      control = `<div class="picklist" data-picklist="${f.name}">
        <div class="picklist-head"><input type="search" placeholder="Filtrar lista..." aria-label="Filtrar ${esc(f.label)}" data-pick-filter autocomplete="off"><span class="picklist-count" data-pick-count></span></div>
        <div class="picklist-body">${opts.length ? opts.map(o => `<label class="pick" data-text="${esc(norm(o.label + ' ' + (o.sub || '')))}"><input type="checkbox" name="${f.name}" value="${esc(o.value)}" ${sel.has(o.value) ? 'checked' : ''}><span class="p-main">${esc(o.label)}</span>${o.sub ? `<span class="p-sub">${esc(o.sub)}</span>` : ''}</label>`).join('') : `<div class="picklist-empty">${esc(f.empty || 'Sin opciones.')}</div>`}</div>
      </div>`;
      labelTag = `<div class="label">${esc(f.label)}${req}</div>`;
    } else {
      const v = f.type === 'date' ? isoDate(item?.[f.name]) : (item?.[f.name] ?? '');
      control = `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" ${f.required ? 'required' : ''} ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} value="${esc(v)}" autocomplete="off">`;
      labelTag = `<label for="${id}">${esc(f.label)}${req}</label>`;
    }
    return `<div class="field ${f.full ? 'full' : ''}" data-field="${f.name}">${labelTag}${control}${f.hint ? `<span class="hint">${esc(f.hint)}</span>` : ''}<span class="field-error" role="alert"></span></div>`;
  }

  const sectionsHtml = (cfg, item) => cfg.sections.map(s => `<section class="form-section"><h3>${esc(s.title)}</h3><div class="form-grid">${s.fields.map(f => fieldHtml(f, item)).join('')}</div></section>`).join('');

  function updatePickCount(pl) {
    const n = $$('input[type=checkbox]:checked', pl).length;
    $('[data-pick-count]', pl).textContent = n + (n === 1 ? ' seleccionado' : ' seleccionados');
  }

  function wireForm(form) {
    $$('.picklist', form).forEach(updatePickCount);
    const clear = e => { const f = e.target.closest('.field'); if (f) f.classList.remove('invalid'); };
    form.addEventListener('input', clear);
    form.addEventListener('change', e => {
      clear(e);
      const pl = e.target.closest('.picklist');
      if (pl && e.target.type === 'checkbox') updatePickCount(pl);
    });
    form.addEventListener('input', e => {
      if (!e.target.matches('[data-pick-filter]')) return;
      const nq = norm(e.target.value.trim());
      $$('.pick', e.target.closest('.picklist')).forEach(p => { p.hidden = !!nq && !p.dataset.text.includes(nq); });
    });
    form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-pick-filter]')) e.preventDefault(); });
  }

  function readBody(cfg, form) {
    const body = {};
    cfg.sections.forEach(s => s.fields.forEach(f => {
      if (f.type === 'picklist') body[f.name] = $$(`input[name="${f.name}"]:checked`, form).map(i => i.value);
      else {
        const v = form.elements[f.name].value;
        body[f.name] = f.type === 'number' ? (v === '' ? NaN : Number(v)) : v.trim();
      }
    }));
    return body;
  }

  function validateBody(cfg, body) {
    const errs = {};
    cfg.sections.forEach(s => s.fields.forEach(f => {
      const v = body[f.name];
      if (f.type === 'picklist') { if (f.required && !v.length) errs[f.name] = 'Seleccione al menos ' + f.noun + '.'; return; }
      if (f.type === 'number') {
        if (Number.isNaN(v)) { if (f.required) errs[f.name] = 'Este campo es obligatorio.'; return; }
        if (f.min != null && f.max != null && (v < f.min || v > f.max)) errs[f.name] = `Debe estar entre ${f.min} y ${f.max}.`;
        else if (f.min === 1 && v < 1) errs[f.name] = 'Debe ser mayor que cero.';
        else if (f.min != null && v < f.min) errs[f.name] = `Debe ser como mínimo ${f.min}.`;
        return;
      }
      if (f.required && !v) errs[f.name] = f.type === 'select' ? 'Seleccione una opción.' : 'Este campo es obligatorio.';
    }));
    if (!Object.keys(errs).length && cfg.validate) Object.assign(errs, cfg.validate(body) || {});
    return errs;
  }

  function applyFieldErrors(form, errs) {
    $$('.field.invalid', form).forEach(f => f.classList.remove('invalid'));
    let first = null;
    Object.entries(errs || {}).forEach(([name, msg]) => {
      const f = $(`.field[data-field="${name}"]`, form);
      if (!f) return;
      f.classList.add('invalid');
      $('.field-error', f).textContent = msg;
      if (!first) first = f;
    });
    if (first) { const c = $('input, select', first); if (c) c.focus({ preventScroll: false }); }
    return !!first;
  }

  async function submitForm(cfg, form, item, alertEl, btn, onSaved) {
    const body = readBody(cfg, form);
    const errs = validateBody(cfg, body);
    if (Object.keys(errs).length) {
      applyFieldErrors(form, errs);
      setAlert(alertEl, 'error', 'Revisa el formulario', 'Hay campos que necesitan tu atención.');
      return;
    }
    alertEl.hidden = true;
    setBusy(btn, true, 'Guardando...');
    try {
      await api(item ? `/api/${cfg.key}/${item.id}` : `/api/${cfg.key}`, { method: item ? 'PUT' : 'POST', body: JSON.stringify(body) });
      await onSaved(item ? cfg.updated : cfg.created);
    } catch (e) {
      setBusy(btn, false);
      const shown = applyFieldErrors(form, e.details);
      setAlert(alertEl, 'error', e.title || 'No se pudo guardar', e.message);
      if (!shown) alertEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /* Formulario dentro de un diálogo (panel de inicio) */
  function openFormDialog(res, item) {
    const cfg = R[res];
    const d = makeDialog({
      title: item ? cfg.editTitle : cfg.newTitle, size: cfg.wide ? 'lg' : '', backdrop: false,
      body: `<div id="dlg-alert" hidden></div><form id="dlg-form" novalidate>${sectionsHtml(cfg, item)}</form>`,
      foot: `<button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="submit" form="dlg-form" class="btn btn-primary" data-submit>${esc(cfg.saveLabel)}</button>`
    });
    const form = $('#dlg-form', d);
    wireForm(form);
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      submitForm(cfg, form, item, $('#dlg-alert', d), $('[data-submit]', d), async msg => {
        d.close();
        toast('ok', 'Cambios guardados', msg);
        await appRefresh();
      });
    });
    const first = $('input:not([type=search]), select', form);
    if (first) first.focus();
  }

  /* Formulario en página propia (/Club/formulario?id=...) */
  async function initForm(res) {
    const cfg = R[res];
    const id = new URLSearchParams(location.search).get('id');
    buildShell(res, false);
    setCrumbs([{ label: 'Inicio', href: '/' }, { label: cfg.plural, href: cfg.listUrl }, { label: id ? cfg.editTitle : cfg.newTitle }]);
    const page = $('#page');
    const head = pageHead({ eyebrow: cfg.plural, title: id ? cfg.editTitle : cfg.newTitle, desc: cfg.formDesc, actions: `<a class="btn btn-secondary" href="${cfg.listUrl}">${icon('back')} Volver al listado</a>` });
    page.innerHTML = head + `<div id="form-alert" hidden></div><div class="panel"><div class="state"><span class="skeleton" style="width:40%;margin:0 auto 12px"></span><span class="skeleton" style="width:70%;margin:0 auto"></span></div></div>`;

    let item = null;
    const [failed] = await Promise.all([
      load(cfg.deps),
      id ? api(`/api/${cfg.key}/${encodeURIComponent(id)}`).then(x => { item = x; }).catch(e => { item = e; }) : Promise.resolve()
    ]);

    if (id && (item instanceof Error || !item)) {
      page.innerHTML = head + alertHtml('error', 'No se pudo cargar el registro', cfg.notFound, `<a class="btn btn-secondary btn-sm" href="${cfg.listUrl}">Volver</a>`);
      return;
    }
    const warn = failed.length ? alertHtml('warn', 'Datos relacionados incompletos', 'No se pudieron cargar: ' + failed.map(k => R[k].plural.toLowerCase()).join(', ') + '. Algunas listas pueden aparecer vacías.') : '';
    page.innerHTML = head + warn + `
      <div id="form-alert" hidden></div>
      <div class="form-layout">
        <form class="panel" id="form" novalidate>
          ${sectionsHtml(cfg, item)}
          <div class="form-foot"><span class="spacer">Los campos con <b style="color:var(--gold-dark)">*</b> son obligatorios.</span><a class="btn btn-secondary" href="${cfg.listUrl}">Cancelar</a><button type="submit" class="btn btn-primary" data-submit>${esc(cfg.saveLabel)}</button></div>
        </form>
        <aside class="panel aside-panel"><div class="panel-head"><h2>Reglas</h2></div><div class="body"><ul class="rules">${cfg.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div></aside>
      </div>`;
    const form = $('#form');
    wireForm(form);
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      submitForm(cfg, form, item, $('#form-alert'), $('[data-submit]', form), msg => {
        flash('ok', 'Cambios guardados', msg);
        location.href = cfg.listUrl;
      });
    });
    const first = $('input:not([type=search]), select', form);
    if (first) first.focus();
  }

  /* ---------------------------------------------------------
     Detalle de un club y sus relaciones
     --------------------------------------------------------- */
  async function showClubDetail(id, mode) {
    const d = makeDialog({ title: 'Detalle del club', size: 'lg', cls: 'club', body: '<div style="padding:28px"><span class="skeleton" style="width:50%;height:22px;margin-bottom:16px"></span><span class="skeleton" style="width:80%;margin-bottom:10px"></span><span class="skeleton" style="width:65%"></span></div>' });
    const body = $('.dialog-body', d);
    try {
      const c = await api('/api/clubes/' + encodeURIComponent(id) + '/detalle');
      const players = (c.jugadores || []).slice().sort((a, b) => (a.numero || 0) - (b.numero || 0));
      const cfg = R.clubes;
      const edit = mode === 'page'
        ? `<a class="btn btn-secondary" href="${cfg.formUrl}?id=${encodeURIComponent(c.id)}">${icon('edit')} Editar club</a>`
        : `<button type="button" class="btn btn-secondary" data-act="edit" data-res="clubes" data-id="${esc(c.id)}">${icon('edit')} Editar club</button>`;
      body.innerHTML = `
        <div class="club-hero">
          <span class="monogram">${esc(initials(c.nombre))}</span>
          <div><h4>${esc(c.nombre)}</h4><div class="meta"><span>${icon('pin')} ${esc(c.ciudad)}</span><span>Estadio ${esc(c.estadio)}</span><span>${plural(players.length, 'jugador', 'jugadores')}</span></div></div>
        </div>
        <div class="detail-body">
          <div class="detail-block"><h5><span>Plantilla</span><span class="num">${players.length}</span></h5>
            ${players.length ? `<table class="table compact"><thead><tr><th>N.º</th><th>Jugador</th><th>Posición</th></tr></thead><tbody>${players.map(j => `<tr><td><span class="shirt">${esc(j.numero)}</span></td><td><span class="cell-title">${esc(fullName(j))}</span></td><td><span class="tag neutral">${esc(j.posicion)}</span></td></tr>`).join('')}</tbody></table>` : '<div class="kv-empty">Sin jugadores registrados.</div>'}
          </div>
          <div>
            <div class="detail-block"><h5>Entrenador</h5>
              ${c.entrenador ? `<div class="kv-row"><span class="monogram alt">${esc(initials(fullName(c.entrenador)))}</span><div class="grow"><div class="cell-title">${esc(fullName(c.entrenador))}</div><div class="cell-sub">${esc(c.entrenador.nacionalidad)} · ${esc(c.entrenador.edad)} años</div></div></div>` : '<div class="kv-empty">—</div>'}
            </div>
            <div class="detail-block"><h5>Asociación</h5>
              ${c.asociacion ? `<div class="kv-row"><span class="monogram gold">${esc(initials(c.asociacion.nombre))}</span><div class="grow"><div class="cell-title">${esc(c.asociacion.nombre)}</div><div class="cell-sub">${esc(c.asociacion.pais)} · Presidente: ${esc(c.asociacion.presidente)}</div></div></div>` : '<div class="kv-empty">—</div>'}
            </div>
            <div class="detail-block"><h5><span>Competiciones</span><span class="num">${(c.competiciones || []).length}</span></h5>
              ${(c.competiciones || []).length ? c.competiciones.map(k => `<div class="kv-row"><div class="grow"><div class="cell-title">${esc(k.nombre)}</div><div class="cell-sub">${esc(fmtDate(k.fechaInicio))} – ${esc(fmtDate(k.fechaFin))}</div></div><span class="tag ${compStatus(k).cls}">${compStatus(k).label}</span></div>`).join('') : '<div class="kv-empty">—</div>'}
            </div>
          </div>
        </div>
        <div class="dialog-foot"><a class="btn btn-ghost spacer" href="/api/clubes/${encodeURIComponent(c.id)}/detalle" target="_blank" rel="noopener">${icon('external')} Ver JSON</a><button type="button" class="btn btn-secondary" data-close>Cerrar</button>${edit}</div>`;
    } catch (e) {
      body.innerHTML = `<div style="padding:22px">${alertHtml('error', 'No se pudo cargar el detalle', e.message)}</div>`;
    }
  }

  /* ---------------------------------------------------------
     Acciones globales (delegación de eventos)
     --------------------------------------------------------- */
  let ctx = { mode: 'page', refresh: async () => {} };

  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const { act, res, id } = t.dataset;
    if (act === 'retry') { await ctx.refresh(); return; }
    if (act === 'detail') { showClubDetail(id, ctx.mode); return; }
    if (act === 'new') { openFormDialog(res, null); return; }
    if (act === 'edit') {
      const dlg = t.closest('dialog'); if (dlg) dlg.close();
      openFormDialog(res, byId(res, id));
      return;
    }
    if (act === 'delete') {
      const item = byId(res, id);
      if (item) confirmDelete(R[res], item, ctx.refresh);
    }
  });

  /* ---------------------------------------------------------
     Página de listado: /Club/listar, /Jugador/listar, ...
     --------------------------------------------------------- */
  async function initList(res) {
    const cfg = R[res];
    buildShell(res, false);
    setCrumbs([{ label: 'Inicio', href: '/' }, { label: cfg.plural }]);
    $('#page').innerHTML = pageHead({ eyebrow: 'Gestión', title: cfg.plural, desc: cfg.desc, actions: newControl(cfg, 'page') }) + '<div id="notice"></div><div id="list-root"></div>';
    const lv = ListView(res, $('#list-root'), 'page');
    showFlash();

    async function refresh() {
      lv.loading();
      const failed = await load(cfg.deps);
      $('#notice').innerHTML = '';
      if (failed.includes(res)) { lv.error(cfg.loadError); return; }
      const rel = failed.filter(k => k !== res);
      if (rel.length) $('#notice').innerHTML = alertHtml('warn', 'Datos relacionados incompletos', 'No se pudieron cargar: ' + rel.map(k => R[k].plural.toLowerCase()).join(', ') + '. Algunas columnas pueden aparecer vacías.');
      lv.ready();
    }
    ctx = { mode: 'page', refresh };
    await refresh();
  }

  /* ---------------------------------------------------------
     Panel de inicio (index.html)
     --------------------------------------------------------- */
  let appViews = {};

  function dashboardHtml(loading, failed) {
    const sk = n => Array.from({ length: n }, () => '<li><span class="skeleton" style="width:100%"></span></li>').join('');
    const cnt = k => loading ? '–' : S[k].length;
    const top = (arr, n) => arr.slice(0, n);

    const clubs = top(S.clubes, 6).map(c => `<tr class="clickable" data-act="detail" data-id="${esc(c.id)}" style="cursor:pointer"><td><div class="cell-main"><span class="monogram">${esc(initials(c.nombre))}</span><div><div class="cell-title">${esc(c.nombre)}</div><div class="cell-sub">${esc(c.ciudad)} · ${esc(c.estadio)}</div></div></div></td><td>${esc(coachName(c.entrenadorId) || 'Sin asignar')}</td><td class="right"><span class="tag num">${(c.jugadoresIds || []).length}</span></td></tr>`).join('');
    const comps = top(S.competiciones, 5).map(c => { const s = compStatus(c); return `<li><span class="monogram gold">${icon('trophy')}</span><div class="grow"><div class="cell-title">${esc(c.nombre)}</div><div class="cell-sub">${esc(fmtDate(c.fechaInicio))} – ${esc(fmtDate(c.fechaFin))}</div></div><div class="aside"><b class="num">${money(c.montoPremio)}</b><span class="tag ${s.cls}">${s.label}</span></div></li>`; }).join('');
    const players = top(S.jugadores, 6).map(j => `<li><span class="shirt">${esc(j.numero)}</span><div class="grow"><div class="cell-title">${esc(fullName(j))}</div><div class="cell-sub">${esc(j.posicion)}</div></div><div class="aside">${esc(clubName(j.clubId) || 'Sin club')}</div></li>`).join('');
    const coaches = top(S.entrenadores, 6).map(e => `<li><span class="monogram alt">${esc(initials(fullName(e)))}</span><div class="grow"><div class="cell-title">${esc(fullName(e))}</div><div class="cell-sub">${esc(e.nacionalidad)} · ${esc(e.edad)} años</div></div><div class="aside">${esc(clubOfCoach(e.id)?.nombre || 'Libre')}</div></li>`).join('');
    const assocs = top(S.asociaciones, 6).map(a => `<li><span class="monogram gold">${esc(initials(a.nombre))}</span><div class="grow"><div class="cell-title">${esc(a.nombre)}</div><div class="cell-sub">${esc(a.pais)} · ${esc(a.presidente)}</div></div><div class="aside"><b class="num">${S.clubes.filter(c => c.asociacionId === a.id).length}</b>clubes</div></li>`).join('');

    const freePlayers = S.jugadores.filter(j => !j.clubId).length;
    const freeCoaches = S.entrenadores.filter(e => !clubOfCoach(e.id)).length;
    const live = S.competiciones.filter(c => compStatus(c).label === 'En curso').length;
    const avg = S.clubes.length ? (S.clubes.reduce((s, c) => s + (c.jugadoresIds || []).length, 0) / S.clubes.length) : 0;
    const biggest = S.clubes.slice().sort((a, b) => (b.jugadoresIds || []).length - (a.jugadoresIds || []).length).slice(0, 4);
    const max = Math.max(1, ...biggest.map(c => (c.jugadoresIds || []).length));
    const kv = (label, val, warn) => `<li><div class="grow">${label}</div><div class="aside"><span class="tag ${warn ? 'warn' : 'neutral'} num">${val}</span></div></li>`;

    const empty = t => `<li><div class="grow muted">${t}</div></li>`;
    const body = (html, emptyText) => loading ? sk(4) : (html || empty(emptyText));

    return `
      ${failed && failed.length ? alertHtml('error', 'No se pudieron cargar algunos datos', failed.map(k => R[k].plural + ': ' + loadErrors[k]).join(' · '), '<button type="button" class="btn btn-secondary btn-sm" data-act="retry">Reintentar</button>') : ''}
      <section class="hero">
        <div class="eyebrow">Panel de administración</div>
        <h1>Sistema de Gestión del Mundial</h1>
        <p>Administra la información mediante una interfaz sencilla conectada a la API REST.</p>
        <div class="head-actions">${newControl(R.clubes, 'spa')}<a class="btn btn-secondary" href="/api" target="_blank" rel="noopener">${icon('external')} Ver API JSON</a></div>
      </section>
      <section class="scoreboard" aria-label="Resumen">
        ${KEYS.map(k => `<a class="score" href="#${k}"><div class="n">${cnt(k)}</div><div class="l"><span>${R[k].plural}</span>${icon('arrow')}</div></a>`).join('')}
      </section>
      <div class="grid-main">
        <section class="panel"><div class="panel-head"><h2>Clubes</h2><a class="link-more" href="#clubes">Ver todos ${icon('arrow')}</a></div>
          <div class="table-wrap"><table class="table compact"><thead><tr><th>Club</th><th>Entrenador</th><th class="right">Jugadores</th></tr></thead><tbody>${loading ? Array.from({ length: 4 }, () => '<tr><td colspan="3"><span class="skeleton"></span></td></tr>').join('') : (clubs || '<tr><td colspan="3" class="muted">No hay clubes registrados.</td></tr>')}</tbody></table></div>
        </section>
        <section class="panel"><div class="panel-head"><h2>Competiciones</h2><a class="link-more" href="#competiciones">Ver todas ${icon('arrow')}</a></div>
          <ul class="list">${body(comps, 'No hay competiciones registradas.')}</ul>
        </section>
      </div>
      <div class="grid-even">
        <section class="panel"><div class="panel-head"><h2>Jugadores</h2><a class="link-more" href="#jugadores">Ver todos ${icon('arrow')}</a></div><ul class="list">${body(players, 'No hay jugadores registrados.')}</ul></section>
        <section class="panel"><div class="panel-head"><h2>Entrenadores</h2><a class="link-more" href="#entrenadores">Ver todos ${icon('arrow')}</a></div><ul class="list">${body(coaches, 'No hay entrenadores registrados.')}</ul></section>
      </div>
      <div class="grid-even">
        <section class="panel"><div class="panel-head"><h2>Asociaciones</h2><a class="link-more" href="#asociaciones">Ver todas ${icon('arrow')}</a></div><ul class="list">${body(assocs, 'No hay asociaciones registradas.')}</ul></section>
        <section class="panel"><div class="panel-head"><h2>Resumen</h2><span class="sub">Calculado con los datos actuales</span></div>
          <ul class="list">${loading ? sk(4) : kv('Jugadores sin club', freePlayers, freePlayers > 0) + kv('Entrenadores sin club', freeCoaches, freeCoaches > 0) + kv('Competiciones en curso', live) + kv('Promedio de jugadores por club', avg.toFixed(1))}</ul>
          ${!loading && biggest.length ? `<div class="panel-head" style="border-top:1px solid var(--line)"><h2>Plantillas más numerosas</h2></div><ul class="list">${biggest.map(c => `<li><div class="grow"><div class="cell-title">${esc(c.nombre)}</div></div><div class="bar" aria-hidden="true"><i style="width:${Math.round((c.jugadoresIds || []).length / max * 100)}%"></i></div><div class="aside num" style="min-width:22px"><b>${(c.jugadoresIds || []).length}</b></div></li>`).join('')}</ul>` : ''}
        </section>
      </div>
      <section class="panel"><div class="panel-head"><h2>Reglas del sistema</h2></div>
        <div class="rules-grid">
          <div class="rule"><h4>MongoDB</h4><p>Persistencia de los datos en la base configurada en <code>application.properties</code>.</p></div>
          <div class="rule"><h4>Relaciones</h4><p>Club ↔ entrenador, jugadores, asociación y competiciones.</p></div>
          <div class="rule"><h4>Validaciones</h4><p>Los formularios muestran los errores enviados por la API.</p></div>
          <div class="rule"><h4>Restricciones</h4><p>Los conflictos de relaciones se devuelven como 409 y no se guardan.</p></div>
        </div>
      </section>`;
  }

  async function appRefresh() {
    const failed = await load(KEYS);
    $('[data-view="inicio"]').innerHTML = dashboardHtml(false, failed);
    KEYS.forEach(k => {
      if (failed.includes(k)) appViews[k].error(R[k].loadError); else appViews[k].ready();
    });
    updateNavCounts();
  }

  function appRoute() {
    const h = (location.hash || '#inicio').slice(1);
    const key = NAV.some(n => n.key === h) ? h : 'inicio';
    $$('.view').forEach(v => { v.hidden = v.dataset.view !== key; });
    setActiveNav(key);
    const label = key === 'inicio' ? 'Inicio' : R[key].plural;
    setCrumbs(key === 'inicio' ? [{ label: 'Mundial Manager' }] : [{ label: 'Mundial Manager', href: '#inicio' }, { label }]);
    document.title = (key === 'inicio' ? 'Sistema de Gestión del Mundial' : label) + ' · Mundial Manager';
    window.scrollTo(0, 0);
  }

  async function initApp() {
    buildShell('inicio', true);
    const page = $('#page');
    page.innerHTML = `<section class="view" data-view="inicio"></section>` + Object.keys(R).map(k => {
      const cfg = R[k];
      return `<section class="view" data-view="${k}" hidden>${pageHead({ eyebrow: 'Gestión', title: cfg.plural, desc: cfg.desc, actions: newControl(cfg, 'spa') })}<div data-list="${k}"></div></section>`;
    }).join('');
    $('[data-view="inicio"]').innerHTML = dashboardHtml(true);
    KEYS.forEach(k => { appViews[k] = ListView(k, $(`[data-list="${k}"]`), 'spa'); });
    ctx = { mode: 'spa', refresh: appRefresh };
    window.addEventListener('hashchange', appRoute);
    appRoute();
    await appRefresh();
  }

  /* ---------------------------------------------------------
     Arranque
     --------------------------------------------------------- */
  const kind = document.body.dataset.page, res = document.body.dataset.resource;
  if (kind === 'app') initApp();
  else if (kind === 'list' && R[res]) initList(res);
  else if (kind === 'form' && R[res]) initForm(res);
})();
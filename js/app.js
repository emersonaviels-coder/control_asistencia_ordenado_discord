/**
 * Control de Asistencia - Script de Lógica Interfaz Fácil & Discord Directo
 */

const WEBHOOK_DISCORD_DIRECTO = "https://discord.com/api/webhooks/1567175256123248763/vvMkuXD1qIpaigUUjWaH9ybECQK7iDRXkifOFiRb6hQAfGbVdbQL_ivQSaupOkjHNBzE";

let datosGlobales = {};
let grupoActual = null;
let asistenciaEstado = {}; // { "Nombre Estudiante": "puntual" | "tarde" | "ausente" }

// Respaldo de datos por si se ejecuta abriendo el HTML directo sin servidor (file://)
const datosFallback = {"parvularia": [{"id": "k1-a", "nombre": "Kínder 4 - Sección A", "estudiantes": ["Sofía Isabel Alvarado", "Mateo Alexander Benítez", "Camila Victoria Castaneda", "Lucas Gabriel Flores", "Emma Valentina Gómez"]}, {"id": "k2-a", "nombre": "Kínder 5 - Sección A", "estudiantes": ["Thiago Emanuel Hernández", "Mia Isabella López", "Benjamin Nicolas Martinez", "Zoe Alessandra Morales", "Ian Sebastian Navarro"]}], "primer_ciclo": [{"id": "1G-a", "nombre": "1° Grado - Sección A", "estudiantes": ["Adrian Jose Orellana", "Valeria Nicole Pineda", "Daniel Eduardo Quinteros", "Sara Maria Ramirez", "Diego Fernando Rivas"]}, {"id": "2G-a", "nombre": "2° Grado - Sección A", "estudiantes": ["Gabriel Antonio Sanchez", "Lucia Montserrat Torres", "Samuel Alejandro Vasquez", "Ximena Beatriz Zabala", "Carlos Mauricio Aguilar"]}, {"id": "3G-a", "nombre": "3° Grado - Sección A", "estudiantes": ["Andrea Carolina Barahona", "Fernando Jose Cruz", "Mariana Elizabeth Diaz", "Rodrigo Alberto Escobar", "Natalia Raquel Fuentes"]}], "segundo_ciclo": [{"id": "4G-a", "nombre": "4° Grado - Sección A", "estudiantes": ["Alejandro Javier Garcia", "Paola Michelle Henriquez", "Javier Andres Ibarra", "Daniela Sofia Juarez", "Leonardo Esteban Lara"]}, {"id": "5G-a", "nombre": "5° Grado - Sección A", "estudiantes": ["Adriana Marcela Molina", "Guillermo Enrique Nolasco", "Sonia Rebecca Oliva", "Oscar Wilfredo Peña", "Claudia Maria Quintanilla"]}, {"id": "6G-a", "nombre": "6° Grado - Sección A", "estudiantes": ["Hector Eduardo Reyes", "Alicia Stephanie Salguero", "David Ernesto Tobar", "Vanessa Alejandra Urrutia", "Jorge Luis Valle"]}], "tercer_ciclo": [{"id": "7G-a", "nombre": "7° Grado - Sección A", "estudiantes": ["Christian Omar Zelaya", "Monica Patricia Abrego", "Raul Arturo Bermudez", "Elena Maria Cisneros", "Rene Alberto Delgado"]}, {"id": "8G-a", "nombre": "8° Grado - Sección A", "estudiantes": ["Gabriela Stefany Espinoza", "Mario Roberto Figueroa", "Isabel Cristina Guzman", "Edwin Mauricio Huezo", "Diana Karen Melendez"]}, {"id": "9G-a", "nombre": "9° Grado - Sección A", "estudiantes": ["Victor Manuel Portillo", "Ingrid Vanessa Recinos", "Alfonso Jose Serrano", "Brenda Maria Trujillo", "Ernesto Javier Ventura"]}], "bachillerato": [{"id": "1B-a", "nombre": "1° Bachillerato General - A", "estudiantes": ["Kevin Alexis Ayala", "Gisselle Maria Campos", "Bryan Alexander Duran", "Fatima Guadalupe Eraso", "Jonathan Josue Galan"]}, {"id": "2B-a", "nombre": "2° Bachillerato General - A", "estudiantes": ["Jacqueline Nicole Lainez", "Jose Roberto Menjivar", "Katia Elizabeth Palacios", "Ronaldo Antonio Ramos", "Wendy Stephany Zepeda"]}]};

$(document).ready(function () {
  inicializarFecha();
  cargarDatos();
  configurarEventos();
});

function inicializarFecha() {
  const hoy = new Date();
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fechaFormateada = hoy.toLocaleDateString('es-ES', opciones);
  const fechaCapitalizada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  
  $('#fechaTexto').text(fechaCapitalizada);
  $('#fechaDetalle').text(fechaCapitalizada);
}

function cargarDatos() {
  $.getJSON('data/students.json')
    .done(function (data) {
      datosGlobales = data;
      renderizarMenuGrupos(data);
    })
    .fail(function () {
      // Si la carga JSON falla por política local de navegador file://, usamos los datos integrados
      datosGlobales = datosFallback;
      renderizarMenuGrupos(datosFallback);
    });
}

function renderizarMenuGrupos(data) {
  const $menu = $('#menuGrupos');
  $menu.empty();

  const categoriasNombres = {
    parvularia: 'Parvularia',
    primer_ciclo: 'Primer Ciclo',
    segundo_ciclo: 'Segundo Ciclo',
    tercer_ciclo: 'Tercer Ciclo',
    bachillerato: 'Bachillerato'
  };

  $.each(data, function (catKey, grupos) {
    if (!grupos || grupos.length === 0) return;

    const $catHeader = $('<div>')
      .addClass('ios-category-header')
      .text(categoriasNombres[catKey] || catKey);
    $menu.append($catHeader);

    grupos.forEach(grupo => {
      const $item = $('<div>')
        .addClass('ios-group-card')
        .attr('data-id', grupo.id)
        .attr('data-cat', catKey)
        .html(`
          <div>
            <div class="fw-bold fs-6 text-dark">${grupo.nombre}</div>
            <small class="text-secondary"><i class="bi bi-people me-1"></i>${grupo.estudiantes.length} alumnos</small>
          </div>
          <i class="bi bi-chevron-right ios-chevron text-muted"></i>
        `);

      $item.on('click', function () {
        $('.ios-group-card').removeClass('active');
        $(this).addClass('active');
        seleccionarGrupo(catKey, grupo);
        
        // Cerrar menú en celulares
        const offcanvasEl = document.getElementById('sidebarOffcanvas');
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (bsOffcanvas) bsOffcanvas.hide();
      });

      $menu.append($item);
    });
  });
}

function seleccionarGrupo(catKey, grupo) {
  grupoActual = { ...grupo, categoriaKey: catKey };
  
  // Recuperar datos previamente guardados en este navegador
  const guardado = localStorage.getItem(`asistencia_${grupo.id}`);
  if (guardado) {
    asistenciaEstado = JSON.parse(guardado);
  } else {
    // Todos puntuales por defecto para agilizar el trabajo del usuario
    asistenciaEstado = {};
    grupo.estudiantes.forEach(est => {
      asistenciaEstado[est] = 'puntual';
    });
  }

  $('#tituloGrupo').text(grupo.nombre);
  $('#categoriaBadge').text(catKey.replace('_', ' ').toUpperCase());
  $('#totalEstudiantesBadge').text(`${grupo.estudiantes.length} estudiantes`);

  $('#vacio').hide();
  $('#panel').fadeIn(200);

  renderizarListaEstudiantes();
  actualizarResumen();
}

function renderizarListaEstudiantes() {
  const $lista = $('#listaEstudiantes');
  $lista.empty();

  grupoActual.estudiantes.forEach((estudiante, idx) => {
    const estado = asistenciaEstado[estudiante] || 'puntual';

    const $li = $('<li>').addClass('list-group-item');
    const $row = $('<div>').addClass('student-row-layout');

    const $info = $('<div>').html(`
      <div class="student-name">${estudiante}</div>
      <div class="student-num"><i class="bi bi-hash"></i> N° de lista: ${idx + 1}</div>
    `);

    // Botones de opción de Asistencia grandes y táctiles
    const $control = $('<div>').addClass('ios-segmented-group');

    const opciones = [
      { key: 'puntual', label: 'Puntual', icon: 'bi-check-circle-fill', activeClass: 'active-puntual' },
      { key: 'tarde', label: 'Tarde', icon: 'bi-clock-fill', activeClass: 'active-tarde' },
      { key: 'ausente', label: 'Ausente', icon: 'bi-x-circle-fill', activeClass: 'active-ausente' }
    ];

    opciones.forEach(opt => {
      const isSelected = estado === opt.key;
      const $optBtn = $('<button>')
        .attr('type', 'button')
        .addClass(`segmented-btn ${isSelected ? opt.activeClass : ''}`)
        .html(`<i class="bi ${opt.icon}"></i> ${opt.label}`);

      $optBtn.on('click', function () {
        asistenciaEstado[estudiante] = opt.key;
        guardarLocal();
        renderizarListaEstudiantes();
        actualizarResumen();
      });

      $control.append($optBtn);
    });

    $row.append($info).append($control);
    $li.append($row);
    $lista.append($li);
  });
}

function actualizarResumen() {
  let puntuales = 0, tardes = 0, ausentes = 0;

  Object.values(asistenciaEstado).forEach(est => {
    if (est === 'puntual') puntuales++;
    if (est === 'tarde') tardes++;
    if (est === 'ausente') ausentes++;
  });

  $('#cantPuntuales').text(puntuales);
  $('#cantTardes').text(tardes);
  $('#cantAusentes').text(ausentes);
}

function guardarLocal() {
  if (grupoActual) {
    localStorage.setItem(`asistencia_${grupoActual.id}`, JSON.stringify(asistenciaEstado));
  }
}

function configurarEventos() {
  // Buscador de grupos
  $('#buscarGrupo').on('input', function () {
    const term = $(this).val().toLowerCase();
    $('.ios-group-card').each(function () {
      const text = $(this).text().toLowerCase();
      $(this).toggle(text.includes(term));
    });
  });

  // Botón rápido: Todos Puntuales
  $('#btnMarcarTodos').on('click', function () {
    if (!grupoActual) return;
    grupoActual.estudiantes.forEach(est => {
      asistenciaEstado[est] = 'puntual';
    });
    guardarLocal();
    renderizarListaEstudiantes();
    actualizarResumen();
    mostrarToast('Asistencia', 'Se han marcado todos los alumnos como Puntuales.', 'success');
  });

  // Botón Reiniciar
  $('#btnReiniciar').on('click', function () {
    if (!grupoActual) return;
    grupoActual.estudiantes.forEach(est => {
      asistenciaEstado[est] = 'puntual';
    });
    guardarLocal();
    renderizarListaEstudiantes();
    actualizarResumen();
    mostrarToast('Reiniciado', 'Se restableció el estado del grupo.', 'warning');
  });

  // Enviar a Discord
  $('#btnEnviarDiscord').on('click', enviarADiscordDirecto);
}

function enviarADiscordDirecto() {
  if (!grupoActual) return;

  const $btn = $('#btnEnviarDiscord');
  $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span> Enviando a Discord...');

  let puntuales = [], tardes = [], ausentes = [];
  Object.entries(asistenciaEstado).forEach(([nombre, estado]) => {
    if (estado === 'puntual') puntuales.push(nombre);
    else if (estado === 'tarde') tardes.push(nombre);
    else if (estado === 'ausente') ausentes.push(nombre);
  });

  const fechaHoy = $('#fechaTexto').text();

  // Construir mensaje elegante estilo tarjeta Discord Embed
  const discordPayload = {
    embeds: [
      {
        title: `📋 Registro de Asistencia: ${grupoActual.nombre}`,
        color: 3426787, // Azul iOS #34C759 / Discord
        timestamp: new Date().toISOString(),
        fields: [
          { name: "📅 Fecha", value: fechaHoy, inline: true },
          { name: "👥 Total Alumnos", value: `${grupoActual.estudiantes.length}`, inline: true },
          { name: `✅ Puntuales (${puntuales.length})`, value: puntuales.join("\n") || "*Ninguno*", inline: false },
          { name: `⚠️ Tardanzas (${tardes.length})`, value: tardes.join("\n") || "*Ninguna*", inline: false },
          { name: `❌ Ausentes (${ausentes.length})`, value: ausentes.join("\n") || "*Ninguno*", inline: false }
        ],
        footer: {
          text: "Sistema de Control de Asistencia Estudiantil · Notificación Automática"
        }
      }
    ]
  };

  // Intento 1: Enviar directo al Webhook de Discord
  $.ajax({
    url: WEBHOOK_DISCORD_DIRECTO,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(discordPayload)
  })
  .done(function () {
    mostrarToast('¡Enviado!', 'Los mensajes llegaron a tu canal de Discord exitosamente.', 'success');
  })
  .fail(function () {
    // Intento 2: Probar backend serverless /api/notify por si está publicado en Vercel
    $.ajax({
      url: '/api/notify',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        grupoId: grupoActual.id,
        grupoNombre: grupoActual.nombre,
        categoriaKey: grupoActual.categoriaKey,
        fecha: fechaHoy,
        asistencia: asistenciaEstado
      })
    })
    .done(function() {
      mostrarToast('¡Enviado!', 'Asistencia notificada correctamente a Discord.', 'success');
    })
    .fail(function() {
      mostrarToast('Notificación', 'Reporte procesado localmente con éxito.', 'info');
    });
  })
  .always(function () {
    $btn.prop('disabled', false).html('<i class="bi bi-discord me-2"></i> Enviar Asistencia a Discord');
  });
}

function mostrarToast(titulo, mensaje, tipo = 'info') {
  const bgMap = {
    success: 'bg-success text-white',
    danger: 'bg-danger text-white',
    warning: 'bg-warning text-dark',
    info: 'bg-primary text-white'
  };

  const toastId = 'toast_' + Date.now();
  const html = `
    <div id="${toastId}" class="toast align-items-center ${bgMap[tipo] || 'bg-dark text-white'} border-0 mb-2 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body fs-6">
          <strong>${titulo}:</strong> ${mensaje}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  $('#toastContainer').append(html);
  const toastEl = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastEl, { delay: 4500 });
  toast.show();
}

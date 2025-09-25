
let mantenimientos = [];

// Agregar mantenimiento a la lista
function agregarMantenimiento() {
  const equipo = document.getElementById("equipo")?.value;
  const fecha = document.getElementById("fecha")?.value;

  if (equipo && fecha) {
    mantenimientos.push({ equipo, fecha, hecho: false });
    mostrarMantenimientos();
    const eq = document.getElementById("equipo");
    const fe = document.getElementById("fecha");
    if (eq) eq.value = "";
    if (fe) fe.value = "";
  } else {
    alert("Por favor completa equipo y fecha.");
  }
}

function mostrarMantenimientos() {
  const lista = document.getElementById("listaMantenimientos");
  if (!lista) return;
  lista.innerHTML = "";
  mantenimientos.forEach((m, idx) => {
    const item = document.createElement("div");
    item.className = "mantenimiento-item";
    item.innerHTML = `
      <span>${m.equipo} — ${m.fecha}</span>
      <button onclick="toggleHecho(${idx})">${m.hecho ? "Deshacer" : "Hecho"}</button>
      <button onclick="eliminar(${idx})">Eliminar</button>
    `;
    lista.appendChild(item);
  });
}

function toggleHecho(i) {
  mantenimientos[i].hecho = !mantenimientos[i].hecho;
  mostrarMantenimientos();
}

function eliminar(i) {
  mantenimientos.splice(i, 1);
  mostrarMantenimientos();
}

// --- GENERAR PDF robusto ---
function generarPDFRobusto() {
  // 1) verificación
  if (typeof html2pdf === "undefined") {
    console.error("html2pdf no está cargado.");
    alert("La librería html2pdf no está cargada. Revisa que el script esté antes de app.js.");
    return;
  }

  const original = document.getElementById("boletaPDF");
  if (!original) {
    alert("No se encontró #boletaPDF en la página.");
    return;
  }

  console.log("Iniciando generación PDF...");

  // 2) clonar el nodo y reemplazar inputs por valores
  const clone = original.cloneNode(true);

  // normalizar fuentes/estilos para impresión
  clone.style.fontFamily = getComputedStyle(document.body).fontFamily || "Arial, sans-serif";
  clone.style.background = "#fff";

  // sustituir inputs/textarea/select por su texto para que el PDF sea estático
  (function reemplazarFormAValor(root) {
    const elements = root.querySelectorAll("input, textarea, select");
    elements.forEach(el => {
      let texto = "";
      const tag = el.tagName.toLowerCase();
      if (tag === "input") {
        const t = (el.type || "").toLowerCase();
        if (t === "checkbox") texto = el.checked ? "☑" : "☐";
        else if (t === "radio") texto = el.checked ? "●" : "○";
        else texto = el.value || "";
      } else if (tag === "textarea") texto = el.value || "";
      else if (tag === "select") {
        const opt = el.options[el.selectedIndex];
        texto = opt ? opt.text : "";
      }
      const span = document.createElement("span");
      span.textContent = texto;
      span.style.whiteSpace = "pre-wrap";
      span.style.display = "inline-block";
      span.style.minWidth = "40px";
      // sustituir manteniendo el contenedor
      if (el.parentNode) el.parentNode.replaceChild(span, el);
    });
  })(clone);

  // quitar botones u otros elementos que no quieres en el PDF
  clone.querySelectorAll("button, .no-print").forEach(n => n.remove());

  // Forzar estilo para que el clone tenga el ancho correcto de A4
  // restamos márgenes laterales (ej. 16mm en total)
  const marginMM = 16; // margen total horizontal
  const pageWidthMM = 210;
  const contentWidthMM = pageWidthMM - marginMM;
  clone.style.boxShadow = "none";
  clone.style.background = "#fff";
  clone.style.margin = "0";
  clone.style.padding = "8mm"; // dentro del A4
  clone.style.boxSizing = "border-box";
  clone.style.width = `${contentWidthMM}mm`;
  clone.style.maxWidth = `${contentWidthMM}mm`;

  // 3) crear contenedor fuera de pantalla (pero visible) para que html2canvas pueda renderizarlo
  const container = document.createElement("div");
  container.id = "pdfCloneContainer";
  // Lo posicionamos fuera de la pantalla pero visible para que html2canvas lo pinte
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.transform = "none";
  container.style.zIndex = "999999";
  container.style.background = "#fff";
  container.style.visibility = "visible"; // visible pero fuera del viewport
  container.style.overflow = "auto";
  container.style.height = "auto";
  container.style.width = `${contentWidthMM}mm`;

  container.appendChild(clone);
  document.body.appendChild(container);

  // Opciones de html2pdf / html2canvas
  const opciones = {
    margin: [8, 8, 8, 8], // top,right,bottom,left en mm
    filename: `Boleta_${document.getElementById("numeroBoleta")?.textContent || "0000"}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: true,
      allowTaint: false,
      scrollY: 0,
      windowWidth: Math.ceil(container.offsetWidth) // ayuda a mantener el ancho
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"] }
  };

  // Pequeño delay para que el navegador aplique estilos y las fuentes se estabilicen
  const delayMs = 1500;
  console.log("Esperando", delayMs, "ms antes de capturar...");
  setTimeout(() => {
    // Lanzar la captura
    html2pdf().set(opciones).from(container).save().then(() => {
      console.log("PDF generado correctamente.");
      // limpiar
      if (container && container.parentNode) container.parentNode.removeChild(container);
      // incrementar número de boleta ahora que la descarga terminó
      let num = parseInt(localStorage.getItem("numeroBoleta")) || 1;
      num++;
      localStorage.setItem("numeroBoleta", num);
      mostrarNumeroBoleta(num);
    }).catch(err => {
      console.error("Error al generar PDF:", err);
      alert("Ocurrió un error generando el PDF. Mira la consola (F12).");
      if (container && container.parentNode) container.parentNode.removeChild(container);
    });
  }, delayMs);
}

// --- resto de utilidades del archivo (no modificado en esencia) ---

function mostrarNumeroBoleta(n) {
  const el = document.getElementById("numeroBoleta");
  if (el) el.textContent = String(n).padStart(4, "0");
}

function cargarNumeroBoleta() {
  let num = parseInt(localStorage.getItem("numeroBoleta")) || 1;
  mostrarNumeroBoleta(num);
}

function establecerFechaLocal() {
  const ahora = new Date();
  const yyyy = ahora.getFullYear();
  const mm = String(ahora.getMonth() + 1).padStart(2, "0");
  const dd = String(ahora.getDate()).padStart(2, "0");
  const fechaFormateada = `${yyyy}-${mm}-${dd}`;
  const campoFecha = document.getElementById("fecha");
  if (campoFecha) campoFecha.value = fechaFormateada;
}

// Ejecutar al cargar la página
window.onload = function () {
  cargarNumeroBoleta();
  establecerFechaLocal();
};

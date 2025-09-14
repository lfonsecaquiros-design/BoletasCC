let mantenimientos = [];

// Agregar mantenimiento a la lista
function agregarMantenimiento() {
  const equipo = document.getElementById("equipo").value;
  const fecha = document.getElementById("fecha").value;

  if (equipo && fecha) {
    const item = { equipo, fecha, hecho: false };
    mantenimientos.push(item);
    mostrarMantenimientos();
    document.getElementById("equipo").value = "";
    document.getElementById("fecha").value = "";
  } else {
    alert("Por favor completa todos los campos");
  }
}

// Cargar número de boleta desde localStorage
function cargarNumeroBoleta() {
  let numero = localStorage.getItem("numeroBoleta");
  if (!numero) {
    numero = 1;
    localStorage.setItem("numeroBoleta", numero);
  }
  mostrarNumeroBoleta(numero);
}

// Mostrar número de boleta en pantalla
function mostrarNumeroBoleta(numero) {
  const span = document.getElementById("numeroBoleta");
  span.textContent = numero.toString().padStart(4, "0");
}

// Mostrar lista de mantenimientos
function mostrarMantenimientos() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";
  mantenimientos.forEach((m, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${m.equipo} - ${m.fecha} 
      <button onclick="marcarHecho(${i})">${m.hecho ? "Desmarcar" : "Hecho"}</button>
    `;
    if (m.hecho) li.style.textDecoration = "line-through";
    lista.appendChild(li);
  });
}

// Agregar fila de voltaje
function agregarFilaVoltaje() {
  const tabla = document.getElementById("tablaVoltajes");
  const cuerpo = tabla.querySelector("tbody");

  const nuevaFila = document.createElement("tr");
  nuevaFila.innerHTML = `
    <td><input type="text" placeholder="Lectura"></td>
    <td><input type="text" value="L1-L2"></td>
    <td><input type="text" placeholder="Control"></td>
    <td><button onclick="eliminarFila(this)">➖</button></td>
  `;

  cuerpo.appendChild(nuevaFila);
}

// Eliminar fila de voltaje
function eliminarFila(boton) {
  const fila = boton.closest("tr");
  fila.remove();
}

// Guardar formulario
function guardarFormulario() {
  const camposCliente = [
    { id: "cliente", nombre: "Cliente" },
    { id: "direccion", nombre: "Dirección" },
    { id: "telefono", nombre: "Teléfono" },
    { id: "fecha", nombre: "Fecha" }
  ];

  let faltantes = [];

  // Validar campos obligatorios
  camposCliente.forEach(campo => {
    const input = document.getElementById(campo.id);
    if (!input || !input.value.trim()) {
      faltantes.push(campo.nombre);
      if (input) input.style.border = "2px solid red";
    } else {
      input.style.border = "";
    }
  });

  if (faltantes.length > 0) {
    alert("Faltan completar:\n\n" + faltantes.join("\n"));
    return; // Detener si falta algo
  }

  // Generar PDF
  generarPDF();

  // Actualizar número de boleta
  let numero = parseInt(localStorage.getItem("numeroBoleta")) || 1;
  numero++;
  localStorage.setItem("numeroBoleta", numero);
  mostrarNumeroBoleta(numero);
}

// Generar PDF local
function generarPDF() {
  const datos = {
    numeroBoleta: document.getElementById("numeroBoleta").textContent,
    factura: document.getElementById("factura").value || "",
    cliente: document.getElementById("cliente").value || "",
    direccion: document.getElementById("direccion").value || "",
    telefono: document.getElementById("telefono").value || "",
    fecha: document.getElementById("fecha").value || "",
    observaciones: document.getElementById("observaciones").value || ""
  };

  const html = `
    <div style="font-family: Arial; padding: 20px;">
      <h2 style="text-align:right;">Boleta Nº ${datos.numeroBoleta}</h2>
      <h1 style="text-align:center;">📋 Mantenimientos de Aires Acondicionados</h1>
      <p><strong>Factura Nº:</strong> ${datos.factura}</p>
      <h2>Datos del Cliente</h2>
      <p><strong>Cliente:</strong> ${datos.cliente}</p>
      <p><strong>Dirección:</strong> ${datos.direccion}</p>
      <p><strong>Teléfono:</strong> ${datos.telefono}</p>
      <p><strong>Fecha:</strong> ${datos.fecha}</p>
      <h2>Observaciones</h2>
      <p>${datos.observaciones}</p>
    </div>
  `;

  const vista = document.getElementById("vistaPDF");
  vista.innerHTML = html;
  vista.style.display = "block";

  const opciones = {
    margin: 10,
    filename: `Boleta_${datos.numeroBoleta}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opciones).from(vista).save().then(() => {
    vista.style.display = "none";
  });
}

// Establecer fecha actual automáticamente
function establecerFechaLocal() {
  const ahoraUTC = new Date();
  const offsetGMT6 = new Date(ahoraUTC.getTime() - (6 * 60 * 60 * 1000));

  const yyyy = offsetGMT6.getUTCFullYear();
  const mm = String(offsetGMT6.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(offsetGMT6.getUTCDate()).padStart(2, '0');
  const fechaFormateada = `${yyyy}-${mm}-${dd}`;

  document.getElementById("fecha").value = fechaFormateada;
}

// Ir al formulario
function irAFormulario() {
  window.location.href = "formulario.html";
}

// Ejecutar al cargar la página
window.onload = function () {
  cargarNumeroBoleta();
  establecerFechaLocal();
};

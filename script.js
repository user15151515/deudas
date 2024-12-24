// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCD5M-oEEfMDzBIajdFHVSVx--2FGbGzHs",
    authDomain: "deudas-22173.firebaseapp.com",
    projectId: "deudas-22173",
    storageBucket: "deudas-22173.firebasestorage.app",
    messagingSenderId: "729150614399",
    appId: "1:729150614399:web:ea535c6403f2b33183884a",
    measurementId: "G-3XMKX8XSM5"
  };
  
  // Inicializar Firebase y Firestore
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const debtsCollection = db.collection("debts");
  
  // Elementos del DOM
  const personInput = document.getElementById("person");
  const amountInput = document.getElementById("amount");
  const descriptionInput = document.getElementById("description");
  const addButton = document.getElementById("add-button");
  const debtTable = document.getElementById("debt-table").querySelector("tbody");
  const totalAmount = document.getElementById("total-amount");
  
  // Variables para totales por persona
  let totalsByPerson = { elia: 0, jana: 0 };
  
  // Función para normalizar nombres
  function normalizeName(name) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Elimina acentos
  }
  
  // Función para actualizar los totales en el DOM
  function updateTotals() {
    const eliaTotal = totalsByPerson.elia.toFixed(2);
    const janaTotal = totalsByPerson.jana.toFixed(2);
    totalAmount.textContent = `Elia: ${eliaTotal} € | Jana: ${janaTotal} €`;
    updatePaymentSummary();
}

  
// Escuchar cambios en Firestore para actualizar la tabla automáticamente



debtsCollection.onSnapshot((snapshot) => {
    // Reiniciar la tabla y totales
    debtTable.innerHTML = "";
    totalsByPerson = { elia: 0, jana: 0 };

    snapshot.forEach((doc) => {
        const debt = doc.data();

        // Mostrar solo deudas no archivadas
        if (debt.archived) return;

        // Calcular totales para personas con deudas activas
        if (debt.status !== "completed") {
            const person = normalizeName(debt.person);
            if (totalsByPerson[person] !== undefined) {
                totalsByPerson[person] += debt.amount;
            }
        }

        // Crear filas dinámicamente en la tabla
        const row = document.createElement("tr");
        row.classList.add(debt.status);
        row.innerHTML = `
        <td>${debt.date}</td>
        <td>${debt.person}</td>
        <td>${debt.amount.toFixed(2)} €</td>
        <td>${debt.description}</td>
        <td>
          <div class="status-cell">
            <!-- Contenedor izquierdo: checkbox -->
            <div class="left-side">
              <label class="check-container">
                <input
                  type="checkbox"
                  class="status-toggle"
                  ${debt.status === "completed" ? "checked" : ""}
                >
                <span class="checkmark"></span>
              </label>
            </div>
            
            <!-- Contenedor derecho: iconos -->
            <div class="right-side">
              <button class="archive-button">
                <!-- tu SVG de papelera -->
              </button>
              <button class="edit-button">
                <!-- tu SVG de lápiz -->
              </button>
            </div>
          </div>
        </td>
      `;
      
      
      
    
    // Nuevo: Escuchar el checkbox en lugar del botón
const statusCheckbox = row.querySelector(".status-toggle");
statusCheckbox.addEventListener("change", async () => {
    // Si está marcado => "completed", si no => "not-paid"
    const newStatus = statusCheckbox.checked ? "completed" : "not-paid";
    
    // Actualizar en Firestore
    await db.collection("debts").doc(doc.id).update({ status: newStatus });

    // Opcional: actualizar la clase de la fila para que se ponga "completed" o "not-paid"
    row.classList.toggle("completed", statusCheckbox.checked);
    row.classList.toggle("not-paid", !statusCheckbox.checked);
});


        // Añadir el botón de papelera si corresponde
        addArchiveButton(row, doc.id);




        debtTable.appendChild(row);
    });

    // Actualizar los totales y el resumen
    updateTotals();
});







  // Añadir una nueva deuda a Firestore
  const startAddDebt = document.getElementById("start-add-debt");
  const wizard = document.getElementById("wizard");
  const steps = document.querySelectorAll(".step");
  const addDebtButton = document.getElementById("add-debt-button");
  
  let debtData = {};
  
// Mostrar el wizard con efecto de fundido
startAddDebt.addEventListener("click", () => {
    wizard.classList.add("visible");
    wizard.style.animation = "fadeIn 0.5s ease-in-out"; // Animación de entrada
    startAddDebt.classList.add("hidden");
    steps.forEach(step => step.classList.add("hidden"));
    document.getElementById("step-name").classList.remove("hidden");
  });
  
  // Cambiar entre pasos con animación
  document.querySelectorAll(".next-button").forEach(button => {
    button.addEventListener("click", () => {
      const currentStep = button.closest(".step");
      const input = currentStep.querySelector("input");
  
      // Validar si el campo actual está vacío
      if (!input.value.trim()) {
        alert("Completa aquest camp abans de continuar!");
        return;
      }
  
      // Validar formato de número en el paso de cantidad
      if (input.id === "wizard-amount") {
        const amountValue = input.value.replace(",", "."); // Cambiar coma por punto
        if (isNaN(parseFloat(amountValue))) {
          alert("Introdueix un valor numèric vàlid!");
          return;
        }
      }
  
      const nextStepId = button.dataset.next;
      currentStep.style.animation = "fadeOut 0.5s forwards";
      setTimeout(() => {
        currentStep.classList.add("hidden");
        currentStep.style.animation = ""; // Resetear animación
        document.getElementById(nextStepId).classList.remove("hidden");
        document.getElementById(nextStepId).style.animation = "fadeIn 0.5s ease-in-out";
      }, 500);
    });
  });
  
  const closeWizardButton = document.getElementById("close-wizard");

// Función para cerrar el wizard
function closeWizard() {
  wizard.style.animation = "fadeOut 0.5s forwards";
  setTimeout(() => {
    wizard.classList.remove("visible");
    wizard.style.animation = ""; // Resetear animación
    startAddDebt.classList.remove("hidden");
  }, 500);
}

// Event listener para cerrar el wizard con la cruz
closeWizardButton.addEventListener("click", closeWizard);

// Event listener para cerrar con "ESC"
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && wizard.classList.contains("visible")) {
    closeWizard();
  }
});


  // Ocultar wizard y resetear al añadir deuda
// Ocultar wizard y resetear al añadir deuda
addDebtButton.addEventListener("click", async () => {
    debtData.name = document.getElementById("wizard-name").value.trim();
    let amountValue = document.getElementById("wizard-amount").value.trim();
    amountValue = parseFloat(amountValue.replace(",", ".")); // Convertir a número
    debtData.amount = parseFloat(amountValue.toFixed(2)); // Asegurar dos decimales
    debtData.description = document.getElementById("wizard-description").value.trim();

    if (!debtData.name || isNaN(debtData.amount) || !debtData.description) {
        alert("Completa tots els camps!");
        return;
    }

    // Agregar deuda a Firestore
    await debtsCollection.add({
        date: new Date().toLocaleDateString(),
        person: debtData.name,
        amount: debtData.amount,
        description: debtData.description,
        status: "not-paid",
    });

    // Resetear flujo y ocultar wizard con animación
    debtData = {};
    wizard.style.animation = "fadeOut 0.5s forwards";
    setTimeout(() => {
        wizard.classList.remove("visible");
        wizard.style.animation = ""; // Resetear animación
        startAddDebt.classList.remove("hidden");
    }, 500);
});

  
  

  



// Llama a updatePaymentSummary cada vez que se actualicen los totales
function updateTotals() {
    const eliaTotal = totalsByPerson.elia.toFixed(2);
    const janaTotal = totalsByPerson.jana.toFixed(2);

    // Actualizar texto en el resumen
    updatePaymentSummary();
}

// Escuchar cambios en Firestore para actualizar la tabla automáticamente
debtsCollection.onSnapshot((snapshot) => {
    debtTable.innerHTML = ""; // Limpiar tabla
    totalsByPerson = { elia: 0, jana: 0 }; // Reiniciar totales

    snapshot.forEach((doc) => {
        const debt = doc.data();

        // Mostrar solo deudas no archivadas
        if (debt.archived) return;

        // Calcular totales para personas con deudas activas
        if (debt.status !== "completed") {
            const person = normalizeName(debt.person);
            if (totalsByPerson[person] !== undefined) {
                totalsByPerson[person] += debt.amount;
            }
        }

        // Crear filas dinámicamente en la tabla
        const row = document.createElement("tr");
        row.classList.add(debt.status);
        row.innerHTML = `
        <td>${debt.date}</td>
        <td>${debt.person}</td>
        <td>${debt.amount.toFixed(2)} €</td>
        <td>${debt.description}</td>
        <td>
          <div class="status-cell">
            <!-- Contenedor izquierdo: checkbox -->
            <div class="left-side">
              <label class="check-container">
                <input
                  type="checkbox"
                  class="status-toggle"
                  ${debt.status === "completed" ? "checked" : ""}
                >
                <span class="checkmark"></span>
              </label>
            </div>
            
            <!-- Contenedor derecho: iconos -->
            <div class="right-side">
              <button class="archive-button">
                <!-- tu SVG de papelera -->
              </button>
              <button class="edit-button">
                <!-- tu SVG de lápiz -->
              </button>
            </div>
          </div>
        </td>
      `;
      
      
      
    // Nuevo: Escuchar el checkbox en lugar del botón
const statusCheckbox = row.querySelector(".status-toggle");
statusCheckbox.addEventListener("change", async () => {
    // Si está marcado => "completed", si no => "not-paid"
    const newStatus = statusCheckbox.checked ? "completed" : "not-paid";
    
    // Actualizar en Firestore
    await db.collection("debts").doc(doc.id).update({ status: newStatus });

    // Opcional: actualizar la clase de la fila para que se ponga "completed" o "not-paid"
    row.classList.toggle("completed", statusCheckbox.checked);
    row.classList.toggle("not-paid", !statusCheckbox.checked);
});



            // Aquí llamamos a `addArchiveButton`
        addArchiveButton(row, doc.id);

        debtTable.appendChild(row);
    });

    // Actualizar los totales y el resumen
    updateTotals();
});
  // Actualiza el mensaje de quién debe pagar a quién
// Actualiza el mensaje de quién debe pagar a quién
function updatePaymentSummary() {
    const eliaTotal = parseFloat(totalsByPerson.elia) || 0;
    const janaTotal = parseFloat(totalsByPerson.jana) || 0;

    // Seleccionar el nuevo resumen en el menú
    const paymentSummary = document.getElementById("payment-summary");

    if (eliaTotal > janaTotal) {
        const amount = (eliaTotal - janaTotal).toFixed(2);
        paymentSummary.textContent = `l'èlia ha de pagar ${amount}€ a la jana`;
    } else if (janaTotal > eliaTotal) {
        const amount = (janaTotal - eliaTotal).toFixed(2);
        paymentSummary.textContent = `la jana ha de pagar ${amount}€ a l'èlia`;
    } else {
        paymentSummary.textContent = `ningú deu res 🥳`;
    }
}


function makeCellEditable(cell, fieldKey, docId) {
    const originalValue = cell.textContent.trim();

    // Crear un input y configurarlo
    const input = document.createElement("input");
    input.type = fieldKey === "amount" ? "number" : "text";
    input.value = originalValue;
    input.className = "edit-input";
    input.style.width = `${Math.max(originalValue.length + 1, 5)}ch`; // Ajustar ancho al texto
    cell.innerHTML = ""; // Vaciar celda
    cell.appendChild(input);
    input.focus();

    // Función para guardar cambios
    const saveChanges = async () => {
        const newValue = fieldKey === "amount"
            ? parseFloat(input.value) || 0
            : input.value.trim();

        if (newValue !== originalValue) {
            const updateData = {};
            updateData[fieldKey] = newValue;
            await db.collection("debts").doc(docId).update(updateData);
            cell.textContent = fieldKey === "amount" ? `${newValue.toFixed(2)} €` : newValue;
        } else {
            cell.textContent = originalValue;
        }

        cleanup(); // Eliminar listeners globales
    };

    // Función para cancelar cambios
    const cancelChanges = () => {
        cell.textContent = originalValue;
        cleanup(); // Eliminar listeners globales
    };

    // Detectar clic fuera del input o toque (móviles)
    const handleOutsideClick = (event) => {
        if (!cell.contains(event.target)) {
            saveChanges(); // Guardar si el clic/gesto está fuera del input
        }
    };

    // Detectar teclas para guardar o cancelar
    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            cancelChanges(); // Cancelar al pulsar Escape
        } else if (event.key === "Enter") {
            saveChanges(); // Guardar al pulsar Enter
        }
    };

    // Limpiar listeners al finalizar edición
    const cleanup = () => {
        document.removeEventListener("click", handleOutsideClick);
        document.removeEventListener("touchstart", handleOutsideClick);
        input.removeEventListener("keydown", handleKeyDown);
    };

    // Agregar listeners globales
    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    input.addEventListener("keydown", handleKeyDown);
}



function addEditButton(row, docId) {
    const editButton = document.createElement("button");
    editButton.classList.add("edit-button");
    editButton.innerHTML = `
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        class="svg-pencil"
      >
        <path d="M2.25 16.0788V21.75H7.92125L18.0642 11.607L12.3938 5.93675L2.25 16.0788ZM21.2075 8.46375C21.5975 8.07375 21.5975 7.44125 21.2075 7.05125L16.9492 2.7925C16.5592 2.4025 15.9267 2.4025 15.5367 2.7925L13.485 4.84425L19.1567 10.515L21.2075 8.46375Z" />
      </svg>
    `;
    editButton.addEventListener("click", () => {
        // Convertir todas las celdas editables en inputs
        const editableCells = [
            { cell: row.cells[1], key: "person" },
            { cell: row.cells[2], key: "amount" },
            { cell: row.cells[3], key: "description" },
        ];

        editableCells.forEach(({ cell, key }) => {
            const originalValue = key === "amount"
                ? parseFloat(cell.textContent) || 0
                : cell.textContent.trim();

            // Crear un input con el borde visible
            const input = document.createElement("input");
            input.type = key === "amount" ? "number" : "text";
            input.value = originalValue;
            input.className = "edit-input"; // Borde se aplica automáticamente
            cell.innerHTML = ""; // Vaciar la celda antes de insertar el input
            cell.appendChild(input);

            // Guardar cambios al salir o presionar Enter
            const saveChanges = async () => {
                const newValue = key === "amount"
                    ? parseFloat(input.value) || 0
                    : input.value.trim();

                if (newValue !== originalValue) {
                    const updateData = {};
                    updateData[key] = newValue;
                    await db.collection("debts").doc(docId).update(updateData);
                    cell.textContent = key === "amount" ? `${newValue.toFixed(2)} €` : newValue;
                } else {
                    cell.textContent = originalValue;
                }
            };

            input.addEventListener("blur", saveChanges);
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    input.blur(); // Forzar guardar al presionar Enter
                }
            });
        });
    });

    const lastCell = row.lastElementChild;
    lastCell.appendChild(editButton);
}

function addArchiveButton(row, docId) {
    const archiveButton = document.createElement("button");
    archiveButton.classList.add("archive-button");
    archiveButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 24 24"
     width="24"
     height="24">
  <path d="M20.54 5.23L19.15 3.9A2 2 0 0 0 17.8 3.34H6.15A2 2 0 0 0 4.8 3.9L3.46 5.23A1.99 1.99 0 0 0 3 6.75V19a2 2 0 0 0 2 2h14
  a2 2 0 0 0 2-2V6.75c0-.53-.21-1.04-.59-1.42zm-1 13.77H4.99V8h14.05v11zM12 10c-.55 0-1 .45-1 1v3H9l3 3 3-3h-2v-3
  c0-.55-.45-1-1-1z"/>
</svg>`;

    archiveButton.addEventListener("click", async () => {
        const debtRef = db.collection("debts").doc(docId);
        await debtRef.update({ archived: true });
        row.remove();
    });

    const lastCell = row.lastElementChild;
    lastCell.style.display = "flex";
    lastCell.style.alignItems = "center";
    lastCell.style.gap = "10px";
    lastCell.appendChild(archiveButton);

    // Llamar a la función de añadir lápiz
    addEditButton(row, docId, {
        person: row.cells[1].textContent,
        amount: parseFloat(row.cells[2].textContent),
        description: row.cells[3].textContent
    });
}



document.getElementById("show-archived").addEventListener("click", async () => {
    const archivedDebtsContainer = document.getElementById("archived-debts");
    if (archivedDebtsContainer.style.display === "none") {
        archivedDebtsContainer.style.display = "block";
        archivedDebtsContainer.innerHTML = ""; // Limpiar contenido previo

        const archivedSnapshot = await db.collection("debts").where("archived", "==", true).get();
        if (!archivedSnapshot.empty) {
            archivedSnapshot.forEach((doc) => {
                const debt = doc.data();
                const card = document.createElement("div");
                card.classList.add("archived-card");
                card.innerHTML = `
                    <h4>${debt.person}</h4>
                    <p>${debt.amount.toFixed(2)} €</p>
                    <p>${debt.description}</p>
                    <p>${debt.date}</p>
                    <div class="archived-actions">
                        <button class="delete-button" data-id="${doc.id}">Eliminar</button>
                    </div>
                `;
                archivedDebtsContainer.appendChild(card);
                
            });

            // Añadir funcionalidad para borrar deudas individuales
            document.querySelectorAll(".delete-button").forEach((button) => {
                button.addEventListener("click", async (event) => {
                    try {
                        const debtId = event.currentTarget.dataset.id; // ID de la deuda
                        const card = event.currentTarget.closest(".archived-card"); // Tarjeta a eliminar
                        if (!card) throw new Error("No se encontró la tarjeta para eliminar.");
            
                        // Eliminar la deuda en Firestore
                        await db.collection("debts").doc(debtId).delete();
            
                        // Eliminar la tarjeta del DOM
                        card.remove();
                    } catch (error) {
                        console.error("Error al eliminar la deuda archivada:", error);
                    }
                });
            });
            
        } else {
            archivedDebtsContainer.innerHTML = "<p>No hay deudas archivadas.</p>";
        }
    } else {
        archivedDebtsContainer.style.display = "none";
    }
});

            



// Función para normalizar nombres (sin tildes ni mayúsculas)
function normalizeName(name) {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Elimina acentos
}

// Botón para añadir deuda de bicicleta
const bicingButton = document.getElementById("add-bicing-button");
bicingButton.addEventListener("click", async () => {
    let existingBicingDebt = null;

    // Cargar todas las deudas no archivadas y buscar la deuda de "bicing" para Jana
    const snapshot = await debtsCollection.where("archived", "==", false).get();
    snapshot.forEach((doc) => {
        const debt = doc.data();
        if (
            normalizeName(debt.person) === "jana" &&
            debt.description.startsWith("bicing")
        ) {
            existingBicingDebt = { id: doc.id, data: debt };
        }
    });

    if (existingBicingDebt) {
        // Si ya existe una deuda de "bicing", actualizarla
        const newAmount = existingBicingDebt.data.amount + 0.35;
        const descriptionMatch = existingBicingDebt.data.description.match(/x(\d+)/);
        const count = descriptionMatch ? parseInt(descriptionMatch[1]) + 1 : 2;
        const newDescription = `bicing x${count}`;

        await debtsCollection.doc(existingBicingDebt.id).update({
            amount: newAmount,
            description: newDescription,
        });
    } else {
        // Si no existe ninguna deuda de "bicing", crear una nueva
        await debtsCollection.add({
            date: new Date().toLocaleDateString(),
            person: "Jana", // Guardar el nombre original
            amount: 0.35,
            description: "bicing",
            status: "not-paid",
            archived: false, // Asegurarnos de que esta deuda no esté archivada
        });
    }
});

// Botones de Bicing
const addBicingButton = document.getElementById("add-bicing-button");
const subtractBicingButton = document.getElementById("subtract-bicing-button");

// Evento para sumar Bicing (+)
addBicingButton.addEventListener("click", async () => {
  let existingBicingDebt = null;
  const snapshot = await debtsCollection.where("archived", "==", false).get();

  snapshot.forEach((doc) => {
    const debt = doc.data();
    if (
      normalizeName(debt.person) === "jana" &&
      debt.description.startsWith("bicing")
    ) {
      existingBicingDebt = { id: doc.id, data: debt };
    }
  });

  if (existingBicingDebt) {
    const newAmount = existingBicingDebt.data.amount + 0.35;
    const descriptionMatch = existingBicingDebt.data.description.match(/x(\d+)/);
    const count = descriptionMatch ? parseInt(descriptionMatch[1]) + 1 : 2;
    const newDescription = `bicing x${count}`;

    await debtsCollection.doc(existingBicingDebt.id).update({
      amount: newAmount,
      description: newDescription,
    });
  } else {
    await debtsCollection.add({
      date: new Date().toLocaleDateString(),
      person: "Jana",
      amount: 0.35,
      description: "bicing",
      status: "not-paid",
      archived: false,
    });
  }
});

// Evento para restar Bicing (-)
subtractBicingButton.addEventListener("click", async () => {
  let existingBicingDebt = null;
  const snapshot = await debtsCollection.where("archived", "==", false).get();

  snapshot.forEach((doc) => {
    const debt = doc.data();
    if (
      normalizeName(debt.person) === "jana" &&
      debt.description.startsWith("bicing")
    ) {
      existingBicingDebt = { id: doc.id, data: debt };
    }
  });

  // Si existe la deuda, restamos 0.35; si llega a 0 o menos, puedes decidir si eliminarla o dejarla en 0
  if (existingBicingDebt) {
    const newAmount = existingBicingDebt.data.amount - 0.35;
    if (newAmount <= 0) {
      // Opcional: Eliminar la deuda o ponerla a 0, a gusto
      await debtsCollection.doc(existingBicingDebt.id).delete();
    } else {
      const descriptionMatch = existingBicingDebt.data.description.match(/x(\d+)/);
      // Cálculo para el contador dentro de la descripción (si existía y no llega a 1)
      let count = 1;
      if (descriptionMatch) {
        const currentCount = parseInt(descriptionMatch[1]);
        count = currentCount > 1 ? currentCount - 1 : 1;
      }
      const newDescription = count > 1 ? `bicing x${count}` : `bicing`;

      await debtsCollection.doc(existingBicingDebt.id).update({
        amount: newAmount,
        description: newDescription,
      });
    }
  }
});

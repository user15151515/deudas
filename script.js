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
                <button class="completed-button ${debt.status}">
                    ${debt.status === "not-paid" ? "Marcar como pagada" : "Marcar como no pagada"}
                </button>
            </td>
        `;

        // Añadir el botón de papelera si corresponde
        addArchiveButton(row, doc.id);

        // Configurar botones para cambiar el estado de la deuda
        const completeButton = row.querySelector(".completed-button");
        completeButton.addEventListener("click", async () => {
            const newStatus = debt.status === "not-paid" ? "completed" : "not-paid";
            await db.collection("debts").doc(doc.id).update({ status: newStatus });

            // Cambiar clases y texto dinámicamente
            completeButton.classList.toggle("completed");
            completeButton.classList.toggle("not-paid");
            completeButton.textContent = newStatus === "completed" ? "Marcar como no pagada" : "Marcar como pagada";

            // Actualizar estilos de la fila
            row.classList.toggle("completed");
            row.classList.toggle("not-paid");
        });


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
                <button class="completed-button ${debt.status}">
                    ${debt.status === "not-paid" ? "Marcar como pagada" : "Marcar como no pagada"}
                </button>
            </td>
        `;

        // Configurar botones para cambiar el estado de la deuda
        const completeButton = row.querySelector(".completed-button");
        completeButton.addEventListener("click", async () => {
            const newStatus = debt.status === "not-paid" ? "completed" : "not-paid";
            await db.collection("debts").doc(doc.id).update({ status: newStatus });
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
function addEditButton(row, docId) {
    const editButton = document.createElement("button");
    editButton.classList.add("edit-button");
    editButton.innerHTML = `<img src="lapiz.png" alt="Editar" style="width: 16px; height: 16px;">`;

    editButton.addEventListener("click", () => {
        // Cambia cada celda editable a un campo de entrada
        const editableCells = [
            { cell: row.cells[1], key: "person" },
            { cell: row.cells[2], key: "amount" },
            { cell: row.cells[3], key: "description" },
        ];

        editableCells.forEach(({ cell, key }) => {
            const initialValue = key === "amount"
                ? parseFloat(cell.textContent) // Si es cantidad, convertir a número
                : cell.textContent.trim(); // Para texto, mantener como string

            // Reemplaza el contenido de la celda con un campo de entrada
            cell.innerHTML = `<input type="${key === "amount" ? "number" : "text"}" 
                                    value="${initialValue}" 
                                    class="edit-input" 
                                    ${key === "amount" ? "step='0.01'" : ""}>`;

            const input = cell.querySelector("input");

            // Al perder el foco o presionar Enter, guardar cambios
            const saveChanges = async () => {
                const newValue = key === "amount"
                    ? parseFloat(input.value) || 0 // Evitar valores NaN
                    : input.value.trim(); // Limpia el valor para texto

                // Validar si hay cambios y guardar en Firestore
                if (newValue !== initialValue) {
                    const updateData = {};
                    updateData[key] = newValue;
                    await db.collection("debts").doc(docId).update(updateData);
                    cell.textContent = key === "amount" ? `${newValue.toFixed(2)} €` : newValue;
                } else {
                    cell.textContent = initialValue; // Si no cambia, restaurar el valor original
                }
            };

            input.addEventListener("blur", saveChanges); // Guardar al perder foco
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    input.blur(); // Forzar el evento blur al presionar Enter
                }
            });

            input.focus(); // Enfocar automáticamente al habilitar edición
        });
    });

    const lastCell = row.lastElementChild;
    lastCell.appendChild(editButton);
}
function makeCellEditable(cell, fieldKey, docId) {
    const originalValue = cell.textContent.trim();

    // Añadir clase para asegurar compatibilidad de estilo
    cell.classList.add("editable-cell");

    // Crear un input que ocupe toda la celda
    const input = document.createElement("input");
    input.type = fieldKey === "amount" ? "number" : "text";
    input.value = fieldKey === "amount" ? parseFloat(originalValue) || 0 : originalValue;
    input.className = "edit-input";

    // Reemplazar contenido de la celda por el input
    cell.innerHTML = "";
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

        // Eliminar clase editable después de guardar
        cell.classList.remove("editable-cell");

        // Remover los event listeners para evitar duplicados
        document.removeEventListener("click", handleOutsideClick);
        document.removeEventListener("keydown", handleKeyDown);
    };

    // Función para cancelar cambios al pulsar ESC o hacer clic fuera del input
    const cancelChanges = () => {
        cell.textContent = originalValue; // Restaurar el valor original
        cell.classList.remove("editable-cell");
        document.removeEventListener("click", handleOutsideClick);
        document.removeEventListener("keydown", handleKeyDown);
    };

    // Detectar clic fuera del input
    const handleOutsideClick = (event) => {
        if (!cell.contains(event.target)) {
            saveChanges();
        }
    };

    // Detectar teclas (ESC para cancelar)
    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            cancelChanges();
        } else if (event.key === "Enter") {
            saveChanges();
        }
    };

    // Agregar listeners globales
    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
}



function addEditButton(row, docId) {
    const editButton = document.createElement("button");
    editButton.classList.add("edit-button");
    editButton.innerHTML = `<img src="lapiz.png" alt="Editar" style="width: 16px; height: 16px;">`;

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
    archiveButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M3 6h18v2H3zm3 3h12v12H6zm5-5h2v3h-2z"/>
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
            // Botón para borrar todo
            archivedDebtsContainer.innerHTML += `<button id="delete-all-archived" class="delete-all-button">Borrar Todo</button>`;
            
            archivedSnapshot.forEach((doc) => {
                const debt = doc.data();
                const row = document.createElement("div");
                row.innerHTML = `
                    <span>${debt.date} - ${debt.person} - ${debt.amount.toFixed(2)} € - ${debt.description}</span>
                    <button class="archive-button delete-button" data-id="${doc.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M3 6h18v2H3zm3 3h12v12H6zm5-5h2v3h-2z"/>
                        </svg>
                    </button>
                `;
                document.getElementById("archived-debts").appendChild(row);
            });
            

            // Funcionalidad para borrar una deuda archivada
            document.querySelectorAll(".delete-button").forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const debtId = event.currentTarget.dataset.id; // Obtiene el ID de la deuda
                    const parentElement = event.currentTarget.parentElement; // Obtiene el elemento contenedor directo del botón

                    // Borra la deuda en Firestore y elimina la fila manualmente
                    try {
                        await db.collection("debts").doc(debtId).delete();
                        if (parentElement) {
                            parentElement.remove(); // Elimina el contenedor completo del DOM
                        }
                    } catch (error) {
                        console.error("Error al borrar la deuda:", error);
                    }
                });
            });



            // Funcionalidad para borrar todas las deudas archivadas
            document.getElementById("delete-all-archived").addEventListener("click", async () => {
                const confirmDelete = confirm("¿Estás seguro de que quieres borrar todas las deudas archivadas?");
                if (confirmDelete) {
                    const batch = db.batch();
                    archivedSnapshot.forEach((doc) => {
                        batch.delete(db.collection("debts").doc(doc.id));
                    });
                    await batch.commit();
                    archivedDebtsContainer.innerHTML = "<p>No hay deudas archivadas.</p>";
                }
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


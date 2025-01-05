// CONFIGURACIÓN FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCD5M-oEEfMDzBIajdFHVSVx--2FGbGzHs",
  authDomain: "deudas-22173.firebaseapp.com",
  projectId: "deudas-22173",
  storageBucket: "deudas-22173.appspot.com",
  messagingSenderId: "729150614399",
  appId: "1:729150614399:web:ea535c6403f2b33183884a",
  measurementId: "G-3XMKX8XSM5"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const debtsCollection = db.collection("debts");

// VARIABLES GLOBALES
let totalsByPerson = { elia: 0, jana: 0 };
let unsubscribeArchived = null;
const debtTable = document.getElementById("debt-table").querySelector("tbody");
const startAddDebt = document.getElementById("start-add-debt");
const wizard = document.getElementById("wizard");
const steps = document.querySelectorAll(".step");
const addDebtButton = document.getElementById("add-debt-button");
const closeWizardButton = document.getElementById("close-wizard");
let allDebts = [];
let currentSortColumn = "date";
let currentSortDirection = "desc";

// FUNCIONES AUXILIARES
function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
function updatePaymentSummary() {
  const eliaTotal = parseFloat(totalsByPerson.elia) || 0;
  const janaTotal = parseFloat(totalsByPerson.jana) || 0;
  const paymentSummary = document.getElementById("payment-summary");
  if (!paymentSummary) return;
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
function updateTotals() {
  updatePaymentSummary();
}
function closeWizard() {
  wizard.style.animation = "fadeOut 0.5s forwards";
  setTimeout(() => {
    wizard.classList.remove("visible");
    wizard.style.animation = "";
    startAddDebt.classList.remove("hidden");
  }, 500);
}

// LÓGICA DE ORDEN Y RENDERIZADO
function parseDate(dateStr) {
  const [day, month, year] = dateStr.split("/");
  return new Date(+year, +month - 1, +day);
}
function sortDebts(column, direction) {
  allDebts.sort((a, b) => {
    let valA, valB;
    switch (column) {
      case "date":
        valA = parseDate(a.date);
        valB = parseDate(b.date);
        break;
      case "person":
        valA = a.person.toLowerCase();
        valB = b.person.toLowerCase();
        break;
      case "amount":
        valA = a.amount;
        valB = b.amount;
        break;
      default:
        valA = a[column];
        valB = b[column];
    }
    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });
}
function renderTable(debtsArray) {
  debtTable.innerHTML = "";
  debtsArray.forEach((debt) => {
    const row = document.createElement("tr");
    row.classList.add(debt.status);
    row.innerHTML = `
      <td>${debt.date}</td>
      <td>${debt.person}</td>
      <td>${debt.amount.toFixed(2)} €</td>
      <td>${debt.description}</td>
      <td>
        <div class="status-cell">
          <div class="left-side">
            <label class="check-container">
              <input
                type="checkbox"
                class="status-toggle"
                ${debt.status === "completed" ? "checked" : ""}
              />
              <span class="checkmark"></span>
            </label>
          </div>
          <div class="right-side">
            <button class="archive-button"></button>
            <button class="edit-button"></button>
          </div>
        </div>
      </td>
    `;
    const statusCheckbox = row.querySelector(".status-toggle");
    statusCheckbox.addEventListener("change", async () => {
      const newStatus = statusCheckbox.checked ? "completed" : "not-paid";
      await debtsCollection.doc(debt.id).update({ status: newStatus });
      row.classList.toggle("completed", statusCheckbox.checked);
      row.classList.toggle("not-paid", !statusCheckbox.checked);
    });
    addArchiveButton(row, debt.id);
    addDeleteButton(row, debt.id);
    debtTable.appendChild(row);
  });
}
function toggleSort(column) {
  if (currentSortColumn === column) {
    currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
  } else {
    currentSortColumn = column;
    currentSortDirection = "asc";
  }
  sortDebts(currentSortColumn, currentSortDirection);
  renderTable(allDebts);
  updateHeadersUI();
}
function updateHeadersUI() {
  [dateHeader, personHeader, amountHeader].forEach((header) => {
    header.textContent = header.textContent.replace(/↓|↑/g, "");
  });
  if (currentSortColumn === "date" && currentSortDirection === "desc") {
    return;
  }
  const arrow = currentSortDirection === "asc" ? "↑" : "↓";
  switch (currentSortColumn) {
    case "date":
      dateHeader.textContent = `Data ${arrow}`;
      break;
    case "person":
      personHeader.textContent = `Qui ${arrow}`;
      break;
    case "amount":
      amountHeader.textContent = `Quantitat ${arrow}`;
      break;
  }
}

// LÓGICA PRINCIPAL SNAPSHOT
debtsCollection.onSnapshot((snapshot) => {
  allDebts = [];
  totalsByPerson = { elia: 0, jana: 0 };
  snapshot.forEach((doc) => {
    const debt = doc.data();
    if (debt.archived) return;
    if (debt.status !== "completed") {
      const personKey = normalizeName(debt.person);
      if (totalsByPerson[personKey] !== undefined) {
        totalsByPerson[personKey] += debt.amount;
      }
    }
    allDebts.push({ id: doc.id, ...debt });
  });
  updateTotals();
  currentSortColumn = "date";
  currentSortDirection = "desc";
  sortDebts(currentSortColumn, currentSortDirection);
  renderTable(allDebts);
  updateHeadersUI();
});

// LISTENERS DE ENCABEZADOS
const dateHeader = document.getElementById("sort-date");
const personHeader = document.getElementById("sort-person");
const amountHeader = document.getElementById("sort-amount");
dateHeader.addEventListener("click", () => toggleSort("date"));
personHeader.addEventListener("click", () => toggleSort("person"));
amountHeader.addEventListener("click", () => toggleSort("amount"));

// FUNCIÓN: Añadir botón de archivar
function addArchiveButton(row, docId) {
  const archiveButton = row.querySelector(".archive-button");
  archiveButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path
        d="M20.54 5.23L19.15 3.9A2 2 0 0 0 17.8 3.34H6.15A2 2 0 0 0 4.8 3.9L3.46 5.23A1.99 1.99 0 0 0 3
           6.75V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.75c0-.53-.21-1.04-.59-1.42zm-1 13.77H4.99V8h14.05v11zM12
           10c-.55 0-1 .45-1 1v3H9l3 3 3-3h-2v-3c0-.55-.45-1-1-1z"
      />
    </svg>
  `;
  archiveButton.addEventListener("click", async () => {
    await db.collection("debts").doc(docId).update({ archived: true });
    row.remove();
  });
  const lastCell = row.lastElementChild;
  lastCell.style.display = "flex";
  lastCell.style.alignItems = "center";
  lastCell.style.gap = "10px";
}

// FUNCIÓN: Añadir botón de eliminar
function addDeleteButton(row, docId) {
  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.innerHTML = `
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M3 6h18v2H3zm3 3h12v12H6zm5-5h2v3h-2z"></path>
                </svg>
  `;

  deleteButton.addEventListener("click", () => {
    showCustomConfirmation(async () => {
      await db.collection("debts").doc(docId).delete();
      row.remove();
    });
  });

  row.querySelector(".right-side").appendChild(deleteButton);
}

function showCustomConfirmation(onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "custom-confirmation-overlay";
  overlay.innerHTML = `
    <div class="custom-confirmation">
      <p>¿Estás seguro de que deseas eliminar esta deuda?</p>
      <div class="button-group">
        <button class="confirm-button">Sí</button>
        <button class="cancel-button">No</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector(".confirm-button").addEventListener("click", () => {
    onConfirm();
    document.body.removeChild(overlay);
  });

  overlay.querySelector(".cancel-button").addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
}


// WIZARD PARA AÑADIR DEUDA
startAddDebt.addEventListener("click", () => {
  wizard.classList.add("visible");
  wizard.style.animation = "fadeIn 0.5s ease-in-out";
  startAddDebt.classList.add("hidden");
  steps.forEach((s) => s.classList.add("hidden"));
  document.getElementById("step-name").classList.remove("hidden");
});
document.querySelectorAll(".next-button").forEach((button) => {
  button.addEventListener("click", () => {
    const currentStep = button.closest(".step");
    const input = currentStep.querySelector("input");
    if (!input.value.trim()) {
      alert("Completa aquest camp abans de continuar!");
      return;
    }
    if (input.id === "wizard-amount") {
      const amountValue = input.value.replace(",", ".");
      if (isNaN(parseFloat(amountValue))) {
        alert("Introdueix un valor numèric vàlid!");
        return;
      }
    }
    const nextStepId = button.dataset.next;
    currentStep.style.animation = "fadeOut 0.5s forwards";
    setTimeout(() => {
      currentStep.classList.add("hidden");
      currentStep.style.animation = "";
      document.getElementById(nextStepId).classList.remove("hidden");
      document.getElementById(nextStepId).style.animation = "fadeIn 0.5s ease-in-out";
    }, 500);
  });
});
closeWizardButton.addEventListener("click", closeWizard);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && wizard.classList.contains("visible")) {
    closeWizard();
  }
});
addDebtButton.addEventListener("click", async () => {
  const name = document.getElementById("wizard-name").value.trim();
  let amountValue = document.getElementById("wizard-amount").value.trim();
  amountValue = parseFloat(amountValue.replace(",", "."));
  const description = document.getElementById("wizard-description").value.trim();
  if (!name || isNaN(amountValue) || !description) {
    alert("Completa tots els camps!");
    return;
  }
  await debtsCollection.add({
    date: new Date().toLocaleDateString(),
    person: name,
    amount: parseFloat(amountValue.toFixed(2)),
    description: description,
    status: "not-paid",
    archived: false
  });
  wizard.style.animation = "fadeOut 0.5s forwards";
  setTimeout(() => {
    wizard.classList.remove("visible");
    wizard.style.animation = "";
    startAddDebt.classList.remove("hidden");
  }, 500);
});

// BOTONES: BICING + RESTAR
document.getElementById("bicing-button").addEventListener("click", async () => {
  let existingBicingDebt = null;
  const snapshot = await debtsCollection.where("archived", "==", false).get();
  snapshot.forEach((doc) => {
    const debt = doc.data();
    if (
      normalizeName(debt.person) === "jana" &&
      debt.description.toLowerCase().startsWith("bicing")
    ) {
      existingBicingDebt = { id: doc.id, data: debt };
    }
  });
  if (existingBicingDebt) {
    const newAmount = parseFloat((existingBicingDebt.data.amount + 0.35).toFixed(2));
    let count = 1;
    const match = existingBicingDebt.data.description.match(/x(\d+)/);
    if (match) count = parseInt(match[1], 10);
    const newDescription = `bicing x${count + 1}`;
    await debtsCollection.doc(existingBicingDebt.id).update({
      amount: newAmount,
      description: newDescription
    });
  } else {
    await debtsCollection.add({
      date: new Date().toLocaleDateString(),
      person: "Jana",
      amount: 0.35,
      description: "bicing",
      status: "not-paid",
      archived: false
    });
  }
});
document
  .getElementById("subtract-bicing-button")
  .addEventListener("click", async (event) => {
    event.stopPropagation();
    let existingBicingDebt = null;
    const snapshot = await debtsCollection.where("archived", "==", false).get();
    snapshot.forEach((doc) => {
      const debt = doc.data();
      if (
        normalizeName(debt.person) === "jana" &&
        debt.description.toLowerCase().startsWith("bicing")
      ) {
        existingBicingDebt = { id: doc.id, data: debt };
      }
    });
    if (existingBicingDebt) {
      const oldAmount = existingBicingDebt.data.amount;
      const newAmount = parseFloat((oldAmount - 0.35).toFixed(2));
      let count = 1;
      const match = existingBicingDebt.data.description.match(/x(\d+)/);
      if (match) count = parseInt(match[1], 10);
      const newCount = count - 1;
      if (newCount <= 0 || newAmount <= 0) {
        await debtsCollection.doc(existingBicingDebt.id).delete();
      } else {
        const newDescription = newCount === 1 ? "bicing" : `bicing x${newCount}`;
        await debtsCollection.doc(existingBicingDebt.id).update({
          amount: newAmount,
          description: newDescription
        });
      }
    }
  });

// BOTÓN: Marcar todas como pagadas
document.getElementById("mark-all-paid").addEventListener("click", async () => {
  const button = document.getElementById("mark-all-paid");
  const snapshot = await debtsCollection.get();
  if (button.textContent === "Marcar tot com a pagat") {
    try {
      const batch = db.batch();
      snapshot.forEach((doc) => {
        if (doc.data().status !== "completed") {
          batch.update(debtsCollection.doc(doc.id), { status: "completed" });
        }
      });
      await batch.commit();
      button.textContent = "Marcar totes com a no pagades";
    } catch (error) {
      console.error("Error al marcar totes les deutes com a pagades:", error);
    }
  } else {
    try {
      const batch = db.batch();
      snapshot.forEach((doc) => {
        if (doc.data().status === "completed") {
          batch.update(debtsCollection.doc(doc.id), { status: "not-paid" });
        }
      });
      await batch.commit();
      button.textContent = "Marcar tot com a pagat";
    } catch (error) {
      console.error("Error al marcar totes les deutes com a no pagades:", error);
    }
  }
});

// BOTÓN: Archivar todas las deudas
document.getElementById("archive-all-debts").addEventListener("click", async () => {
  try {
    const snapshot = await debtsCollection.get();
    const batch = db.batch();
    snapshot.forEach((doc) => {
      if (!doc.data().archived) {
        batch.update(debtsCollection.doc(doc.id), { archived: true });
      }
    });
    await batch.commit();
  } catch (error) {
    console.error("Error al archivar todas las deudas:", error);
    alert("Ocurrió un error al intentar archivar las deudas.");
  }
});

// BOTÓN: Mostrar/ocultar deudas archivadas
// BOTÓN: Mostrar/ocultar deudas archivadas
document.getElementById("show-archived").addEventListener("click", async () => {
  const archivedDebtsContainer = document.getElementById("archived-debts");
  if (!archivedDebtsContainer) return;

  if (archivedDebtsContainer.style.display === "none" || archivedDebtsContainer.style.display === "") {
    archivedDebtsContainer.style.display = "block";
    archivedDebtsContainer.innerHTML = "";
    unsubscribeArchived = db
      .collection("debts")
      .where("archived", "==", true)
      .onSnapshot((snapshot) => {
        archivedDebtsContainer.innerHTML = "";
        if (snapshot.empty) {
          archivedDebtsContainer.innerHTML = "<p>No hay deudas archivadas.</p>";
          return;
        }
        archivedDebtsContainer.innerHTML = "<ul class='archived-list'></ul>";
        const list = archivedDebtsContainer.querySelector(".archived-list");
        snapshot.forEach((doc) => {
          const debt = doc.data();
          const li = document.createElement("li");
          li.classList.add("archived-item");
          li.innerHTML = `
            <div class="archived-left">
              <strong>${debt.person}</strong> 
              <span>${debt.amount.toFixed(2)} €</span>
              <em>${debt.description}</em>
              <small>${debt.date}</small>
            </div>
            <div class="archived-right">
              <button class="delete-button" data-id="${doc.id}">Eliminar</button>
              <button class="unarchive-button" data-id="${doc.id}">Desarchivar</button>
            </div>
          `;
          list.appendChild(li);
        });
      });
  } else {
    archivedDebtsContainer.style.display = "none";
    archivedDebtsContainer.innerHTML = "";
    if (unsubscribeArchived) {
      unsubscribeArchived();
      unsubscribeArchived = null;
    }
  }
});


// Delegación de eventos para botones en deudas archivadas
const archivedDebtsContainer = document.getElementById("archived-debts");
if (archivedDebtsContainer) {
  archivedDebtsContainer.addEventListener("click", async (event) => {
    const target = event.target;

    // Encontrar el botón más cercano en caso de que el click sea en el SVG o en el texto
    const deleteButton = target.closest(".delete-button");
    const unarchiveButton = target.closest(".unarchive-button");

    if (deleteButton) {
      const debtId = deleteButton.dataset.id;
      const listItem = deleteButton.closest(".archived-item");
      if (!debtId || !listItem) return;

      try {
        await db.collection("debts").doc(debtId).delete();
        listItem.remove();
      } catch (error) {
        console.error("Error al eliminar la deuda archivada:", error);
        alert("Ocurrió un error al eliminar la deuda archivada.");
      }
    }

    if (unarchiveButton) {
      const debtId = unarchiveButton.dataset.id;
      const listItem = unarchiveButton.closest(".archived-item");
      if (!debtId || !listItem) return;

      try {
        await db.collection("debts").doc(debtId).update({ archived: false });
        listItem.remove();
      } catch (error) {
        console.error("Error al desarchivar la deuda:", error);
        alert("Ocurrió un error al desarchivar la deuda.");
      }
    }
  });
}

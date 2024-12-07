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
const debtsCollection = db.collection("debts");


debtsCollection.onSnapshot((snapshot) => {
    debtTable.innerHTML = ""; // Limpiar tabla
    totalsByPerson = { elia: 0, jana: 0 }; // Reiniciar totales

    snapshot.forEach((doc) => {
        const debt = doc.data();

        // Mostrar solo deudas no archivadas
        if (debt.archived) return;

        // Actualizar los totales por persona solo si la deuda no está pagada
        if (debt.status !== "completed") {
            const person = normalizeName(debt.person);
            if (totalsByPerson[person] !== undefined) {
                totalsByPerson[person] += debt.amount;
            }
        }

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

        // Añadir botón de archivar si está pagada
        if (debt.status === "completed") {
            addArchiveButton(row, doc.id);
        }

        const completeButton = row.querySelector(".completed-button");
        completeButton.addEventListener("click", async () => {
            const newStatus = debt.status === "not-paid" ? "completed" : "not-paid";
            await db.collection("debts").doc(doc.id).update({ status: newStatus });
        });

        debtTable.appendChild(row);
    });

    // Actualizar los totales y el resumen
    updateTotals();
});





  // Añadir una nueva deuda a Firestore
  addButton.addEventListener("click", async () => {
    const person = normalizeName(personInput.value.trim());
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value.trim();
  
    if (!person || isNaN(amount) || amount <= 0 || !description) {
      alert("ompleho tot puta");
      return;
    }
  
    await debtsCollection.add({
      date: new Date().toLocaleDateString(),
      person: personInput.value.trim(),
      amount: amount,
      description: description,
      status: "not-paid",
    });
  
    // Limpiar los campos del formulario
    personInput.value = "";
    amountInput.value = "";
    descriptionInput.value = "";
  });
  



// Llama a updatePaymentSummary cada vez que se actualicen los totales
function updateTotals() {
    const eliaTotal = totalsByPerson.elia.toFixed(2);
    const janaTotal = totalsByPerson.jana.toFixed(2);
    totalAmount.textContent = `Elia: ${eliaTotal} € | Jana: ${janaTotal} €`;
    updatePaymentSummary();
}

  // Actualiza el mensaje de quién debe pagar a quién
  function updatePaymentSummary() {
    const eliaTotal = parseFloat(totalsByPerson.elia) || 0;
    const janaTotal = parseFloat(totalsByPerson.jana) || 0;
    const paymentSummary = document.getElementById("payment-summary");

    if (eliaTotal > janaTotal) {
        const amount = (eliaTotal - janaTotal).toFixed(2);
        paymentSummary.textContent = `L'Èlia ha de pagar ${amount} € a la Jana`;
    } else if (janaTotal > eliaTotal) {
        const amount = (janaTotal - eliaTotal).toFixed(2);
        paymentSummary.textContent = `La Jana ha de pagar ${amount} € a l'Èlia`;
    } else {
        paymentSummary.textContent = `Ningú no deu res a ningú 🥳`;
    }
}

function addArchiveButton(row, docId) {
    const archiveButton = document.createElement("button");
    archiveButton.classList.add("archive-button");

    // Añadir el ícono de papelera al botón
    archiveButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M3 6h18v2H3zm3 3h12v12H6zm5-5h2v3h-2z"/>
        </svg>
    `;

    archiveButton.addEventListener("click", async () => {
        const debtRef = db.collection("debts").doc(docId);
        await debtRef.update({ archived: true });
        row.remove(); // Elimina la deuda de la tabla principal
    });

    const lastCell = row.lastElementChild;
    lastCell.style.display = "flex"; // Asegura que los botones estén en línea
    lastCell.style.alignItems = "center"; // Alinea verticalmente los botones
    lastCell.style.gap = "10px"; // Espacio entre botones
    lastCell.appendChild(archiveButton);
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
                const row = document.createElement("div");
                row.classList.add("archived-row");
                row.innerHTML = `
                    <p>${debt.date} - ${debt.person} - ${debt.amount.toFixed(2)} € - ${debt.description}</p>
                `;
                archivedDebtsContainer.appendChild(row);
            });
        } else {
            archivedDebtsContainer.innerHTML = "<p>No hay deudas archivadas.</p>";
        }
    } else {
        archivedDebtsContainer.style.display = "none";
    }
});

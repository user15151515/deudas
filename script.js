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
  }
  
  // Escuchar cambios en Firestore para actualizar la tabla automáticamente
  const debtsCollection = db.collection("debts");
  debtsCollection.onSnapshot((snapshot) => {
    debtTable.innerHTML = ""; // Limpiar tabla
    totalsByPerson = { elia: 0, jana: 0 }; // Reiniciar totales
  
    snapshot.forEach((doc) => {
      const debt = doc.data();
      const row = document.createElement("tr");
      row.classList.add(debt.status);
      row.innerHTML = `
        <td>${debt.date}</td>
        <td>${debt.person}</td>
        <td>${debt.amount.toFixed(2)} €</td>
        <td>${debt.description}</td>
        <td><button class="completed-button ${debt.status}">Marcar com a pagada</button></td>
      `;
  
      // Actualizar totales
      const person = normalizeName(debt.person);
      if (totalsByPerson[person] !== undefined) {
        if (debt.status === "not-paid") {
          totalsByPerson[person] += debt.amount;
        }
      }
  
      // Añadir evento al botón para alternar el estado de pago
      const completeButton = row.querySelector(".completed-button");
      completeButton.addEventListener("click", async () => {
        const newStatus = debt.status === "not-paid" ? "completed" : "not-paid";
        await db.collection("debts").doc(doc.id).update({ status: newStatus });
      });
  
      debtTable.appendChild(row);
    });
  
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
  
import { initializeApp } from "firebase/app";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const firebaseConfig = {
  apiKey: "AIzaSyBduifCpU9Jx4-pRDjSaMWQ-V0POWTKavE",
  authDomain: "controlfinancierosites.firebaseapp.com",
  projectId: "controlfinancierosites",
  storageBucket: "controlfinancierosites.firebasestorage.app",
  messagingSenderId: "10503208933",
  appId: "1:10503208933:web:a00c74bbbeaebdfab2790c",
  measurementId: "G-DT0LYS17JD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const exportPath = path.resolve(__dirname, "../../data_export_sqlite.json");
const rawData = JSON.parse(fs.readFileSync(exportPath, "utf8"));

async function migrate() {
  console.log("Iniciando migración de datos a Cloud Firestore...");

  // 1. config_gastos
  if (rawData.config_gastos && rawData.config_gastos.length > 0) {
    await setDoc(doc(db, "config_gastos", "main"), rawData.config_gastos[0]);
    console.log("✓ config_gastos migrado correctamente");
  }

  // 2. config_futuro
  if (rawData.config_futuro && rawData.config_futuro.length > 0) {
    await setDoc(doc(db, "config_futuro", "main"), rawData.config_futuro[0]);
    console.log("✓ config_futuro migrado ($3,682.95 Cajita Turbo)");
  }

  // 3. gastos_diarios
  if (rawData.gastos_diarios) {
    for (const g of rawData.gastos_diarios) {
      await setDoc(doc(db, "gastos_diarios", String(g.id)), g);
    }
    console.log(`✓ ${rawData.gastos_diarios.length} gastos diarios migrados`);
  }

  // 4. gastos_ocio
  if (rawData.gastos_ocio) {
    for (const o of rawData.gastos_ocio) {
      await setDoc(doc(db, "gastos_ocio", String(o.id)), o);
    }
    console.log(`✓ ${rawData.gastos_ocio.length} gastos de ocio migrados`);
  }

  // 5. compras_tdc
  if (rawData.compras_tdc) {
    for (const c of rawData.compras_tdc) {
      await setDoc(doc(db, "compras_tdc", String(c.id)), c);
    }
    console.log(`✓ ${rawData.compras_tdc.length} compras TDC migradas`);
  }

  // 6. historico_quincenas_gastos
  if (rawData.historico_quincenas_gastos && rawData.historico_quincenas_gastos.length > 0) {
    for (const h of rawData.historico_quincenas_gastos) {
      await setDoc(doc(db, "historico_quincenas_gastos", String(h.id)), h);
    }
    console.log(`✓ ${rawData.historico_quincenas_gastos.length} quincenas de gastos migradas`);
  }

  // 7. historico_quincenas_futuro
  if (rawData.historico_quincenas_futuro && rawData.historico_quincenas_futuro.length > 0) {
    for (const hf of rawData.historico_quincenas_futuro) {
      await setDoc(doc(db, "historico_quincenas_futuro", String(hf.id)), hf);
    }
    console.log(`✓ ${rawData.historico_quincenas_futuro.length} quincenas de futuro migradas`);
  }

  console.log("\n=============================================");
  console.log("¡Migración a Cloud Firestore COMPLETADA AL 100%!");
  console.log("=============================================");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Error durante la migración a Firestore:", err);
  process.exit(1);
});

function step() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // --- Hojas -- -
  var regSheet = ss.getSheetByName("Registers");
  var progSheet = ss.getSheetByName("Program");
  var ioSheet = ss.getSheetByName("IO");

  // --- Obtener Program Counter (PC) ---
  var pc = regSheet.getRange("B5").getValue(); // suponiendo PC está en fila 5, col B

  // --- Leer instrucción ---
  var instruction = progSheet.getRange(pc + 2, 1).getValue(); 
  // +2 porque fila 1 es encabezado y PC=0 debe ir a fila 2

  // --- Parsear instrucción ---
  var parts = instruction.split(" ");
  var opcode = parts[0];
  var args = parts.slice(1).join(" ").split(",");

  // --- Ejecutar según opcode ---
  if (opcode == "MOV") {
    var dest = args[0].trim();
    var value = parseInt(args[1].trim());
    // Guardar en Registers
    updateRegister(regSheet, dest, value);
  }

  if (opcode == "ADD") {
    var dest = args[0].trim();
    var addValue = parseInt(args[1].trim());
    var current = getRegisterValue(regSheet, dest);
    updateRegister(regSheet, dest, current + addValue);
  }

  if (opcode == "PRINT") {
    var reg = args[0].trim();
    var val = getRegisterValue(regSheet, reg);
    ioSheet.appendRow(["PRINT", val]);
  }

  if (opcode == "HALT") {
    SpreadsheetApp.getUi().alert("Programa terminado.");
    return;
  }

  // --- Incrementar PC ---
  updateRegister(regSheet, "PC", pc + 1);
}

// --- Funciones auxiliares ---
function getRegisterValue(sheet, name) {
  var range = sheet.getRange("A2:A10").getValues(); 
  for (var i = 0; i < range.length; i++) {
    if (range[i][0] == name) {
      return sheet.getRange(i + 2, 2).getValue();
    }
  }
  return null;
}

function updateRegister(sheet, name, value) {
  var range = sheet.getRange("A2:A10").getValues();
  for (var i = 0; i < range.length; i++) {
    if (range[i][0] == name) {
      sheet.getRange(i + 2, 2).setValue(value);
      return;
    }
  }
}

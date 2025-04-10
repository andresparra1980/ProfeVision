// Función para generar un marcador ArUco 4x4 como SVG path
// Los marcadores ArUco 4x4 son una matriz de 6x6 (incluyendo el borde)
export function generateArucoMarkerPath(markerId: number): string {
  if (markerId < 0 || markerId > 49) { // 4x4 tiene 50 marcadores únicos (0-49)
    throw new Error('Invalid ArUco marker ID. Must be between 0 and 49.');
  }

  // Convertir el ID a una matriz binaria 4x4
  const binaryMatrix = generateBinaryMatrix(markerId);
  
  // Tamaño de cada celda en unidades SVG
  const cellSize = 1;
  const totalSize = cellSize * 6; // 4x4 interior + 2 para bordes

  // Generar los paths
  const paths = {
    // Path negro para el fondo y el borde
    black: `M 0,0 h ${totalSize} v ${totalSize} h -${totalSize} Z`,
    // Path blanco para las celdas que deben ser blancas
    white: ''
  };

  // Agregar celdas blancas
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      // Si es borde, continuar (se mantiene negro)
      if (i === 0 || i === 5 || j === 0 || j === 5) continue;

      // Si el bit es 0 en la matriz, agregar un cuadrado blanco
      if (!binaryMatrix[i-1][j-1]) {
        const x = j * cellSize;
        const y = i * cellSize;
        paths.white += `M ${x},${y} h ${cellSize} v ${cellSize} h -${cellSize} Z `;
      }
    }
  }

  return JSON.stringify(paths);
}

// Función auxiliar para generar la matriz binaria 4x4 desde un ID
function generateBinaryMatrix(id: number): boolean[][] {
  const matrix = Array(4).fill(null).map(() => Array(4).fill(false));
  const binary = id.toString(2).padStart(16, '0');
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      matrix[i][j] = binary[i * 4 + j] === '1';
    }
  }
  
  return matrix;
}

// IDs predefinidos para las esquinas
export const CORNER_MARKER_IDS = {
  // Marcadores externos (48x48 pts)
  EXTERNAL: {
    TOP_LEFT: 0,
    TOP_RIGHT: 1,
    BOTTOM_LEFT: 2,
    BOTTOM_RIGHT: 3
  },
  // Marcadores internos (24x24 pts)
  INTERNAL: {
    TOP_LEFT: 4,
    TOP_RIGHT: 5,
    BOTTOM_LEFT: 6,
    BOTTOM_RIGHT: 7
  }
} as const; 
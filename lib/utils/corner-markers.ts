import { Style } from '@react-pdf/types';

// Constantes para los marcadores L
const PAGE_DIMENSIONS = {
  LETTER: { width: 612, height: 792 }, // puntos (72 DPI)
  A4: { width: 595, height: 842 }
} as const;

// Función para calcular las dimensiones del marcador L basado en el tamaño de la página
export function calculateMarkerDimensions(pageSize: keyof typeof PAGE_DIMENSIONS = 'LETTER') {
  const { width, height } = PAGE_DIMENSIONS[pageSize];
  const minDimension = Math.min(width, height);
  
  return {
    // 5% del lado más pequeño de la página
    size: Math.round(minDimension * 0.05),
    // 2% del lado más pequeño para el margen desde el borde
    margin: Math.round(minDimension * 0.02),
    // Aumentado de 20% a 40% del tamaño del marcador para el grosor
    thickness: Math.round(minDimension * 0.05 * 0.4)
  };
}

// Función para generar el path SVG de un marcador en forma de L
export function generateLMarkerPath(size: number): string {
  // Aumentado de 20% a 40% del tamaño, mínimo 4pts (antes 2pts)
  const thickness = Math.max(Math.round(size * 0.4), 4);
  
  // El path dibuja un L negro con proporciones 1:1
  return `M 0,0 
          h ${size} 
          v ${thickness} 
          h -${size - thickness} 
          v ${size - thickness} 
          h -${thickness} 
          v -${size} 
          Z`;
}

// Función para generar los estilos del contenedor del marcador
export function generateMarkerContainerStyle(position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', margin: number): Style {
  const baseStyle = {
    position: 'absolute' as const,
    backgroundColor: '#FFFFFF',
    padding: Math.round(margin * 0.25),
  };

  const positionStyles = {
    'top-left': { top: margin, left: margin },
    'top-right': { top: margin, right: margin, transform: 'rotate(90deg)' },
    'bottom-left': { bottom: margin, left: margin, transform: 'rotate(-90deg)' },
    'bottom-right': { bottom: margin, right: margin, transform: 'rotate(180deg)' }
  };

  return { ...baseStyle, ...positionStyles[position] } as Style;
} 
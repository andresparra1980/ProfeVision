# Plan de Mejoras Visuales - Febrero 2026

## Página Pública ProfeVision

---

## 1. Dirección Aesthetic

**Estilo**: Edu-tech profesional
- Verde corporativo dinámico (#0b890f) con acentos complementarios
- Diseño limpio pero moderno
- Profesional pero no aburrido

## 2. Recursos

**Tipografía**: Google Fonts (Free)
- Display: Fuente distintiva para títulos
- Body: Fuente legible y profesional

**Animaciones**: CSS-only donde sea posible
- Transiciones CSS
- Keyframes personalizados
- Intersection Observer para scroll-triggered animations

## 3. Restricciones

**Ligero**: 
- Sin librerías de animación pesadas
- Priorizar CSS sobre JS
- Animaciones GPU-accelerated (transform, opacity)
- Máximo ~50KB de CSS adicional

---

## Mejoras a Implementar

### 1. Hero Section

**Actual**: Imagen estática + gradientes sutiles

**Mejoras**:
- [ ] Mesh gradient animado como fondo (CSS only)
- [ ] Imagen del hero con efecto de parallax sutil
- [ ] Mask decorativa flotante alrededor de la imagen
- [ ] Texto del hero con stagger animation en load
- [ ] Floating elements decorativos sutiles

### 2. Features Section

**Actual**: Grid de cards básico

**Mejoras**:
- [ ] Scroll-triggered fade-in con stagger
- [ ] Cards con hover 3D tilt effect
- [ ] Iconos con background animado
- [ ] Border sutil con gradient

### 3. Modules Section

**Actual**: Grid de 6 cards

**Mejoras**:
- [ ] Scroll-triggered reveal animation
- [ ] Hover con lift + shadow expand
- [ ] Gradient border en hover
- [ ] Elementos decorativos flotantes

### 4. Benefits Section

**Actual**: Layout split con tabla

**Mejoras**:
- [ ] Imagen/tabla con parallax
- [ ] Stagger animation en la lista
- [ ] Elementos decorativos en background

### 5. CTA Section

**Actual**: Fondo verde estático

**Mejoras**:
- [ ] Animated gradient background
- [ ] Stats counter animation
- [ ] Buttons con glow effect
- [ ] Floating shapes decorativos

### 6. Global Effects

- [ ] Smooth scroll behavior
- [ ] Page load animation (fade-in)
- [ ] Navigation con blur effect en scroll

---

## Implementación

### Prioridad 1 (Alto Impacto)
1. Hero animations (stagger + mesh gradient)
2. Scroll-triggered animations en todas las secciones
3. CTA animated gradient

### Prioridad 2 (Mejora Visual)
4. Card hover effects
5. Micro-interacciones en buttons
6. Floating decorative elements

### Prioridad 3 (Polish)
7. Text animations
8. Parallax effects
9. Border/background enhancements

---

## No Implementar

- ❌ Librerías de animación (framer-motion, gsap)
- ❌ Three.js o WebGL
- ❌ Partículas complejas
- ❌ Video backgrounds
- ❌ Fuentes premium

---

## Notas

- Todas las animaciones deben funcionar en Chrome, Firefox, Safari, Edge
- Dark mode debe funcionar correctamente
- Mobile-first: animaciones reducidas en móvil si es necesario
- Accessibility: respectar `prefers-reduced-motion`

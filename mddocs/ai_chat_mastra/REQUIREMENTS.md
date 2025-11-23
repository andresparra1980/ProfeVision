
# Conversion AIchat legacy a AIchat usando MastraAI latest

## Objetivo del Cambio

Desarrollar nuevo chat, reemplazar api/chat por un chat basado en un agente MastraAI con Orchestrador, Tools, validadores, feedback de cada operacion, etc.  Usar AI-SDK de Vercel V5, con sus correspondientes dependencias actualizadas. Como proveedor de IA sigamos usando Openrouter asi:

### Ejemplo de codigo
```ts
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// OpenRouter provider
const openrouter = createOpenRouter({
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/",
    "X-Title": "ProfeVision Chat - Mastra",
  },
});


export const chatOrchestratorAgent = new Agent({
  name: 'ProfeVision Chat Orchestrator',
  instructions: chatOrchestratorPrompt,
  model: openrouter(process.env.OPENAI_MODEL!),
  tools: {
    ..tools
  },
});

```
Continuar usando observabilidad que se tienen implementada en este proyecto para todos los procesos agenticos con LangSmith, y siguiendo la filosofia Local First. Con la capacidad de ir adicionando tools en funcion de los requerimientos pero que el resultado se ajuste a los requierimientos de schema que necesita el aplicativo para poder grabar las preguntas en la db. Finalmente el fujo debe hacer manejo de errores del LLM, de schema 'graciouslly' priorizando UX. Tambien con la posibilidad de en env var definir cual se usa miestras se hace la migracion final (`AI_CHAT_MASTRA=true/false`). 


## Resultados esperados:

Un chat mas natural para el usuario, que tenga proper feedback de lo que esta pasando (highly summarized por supuesto, no solo mensajes predefinidos). El proceso agentico debe generar las preguntas paralelamente, con un paso previo de planeacion al cual el agente define cada pregunta esperada (tema exacto, pregunta ejemplo, tipo,etc) y ejecuta pseudo paralelamente o en bulk la generacion de preguntas y luego pasa por un proceso de organizacion del esquema del examen y un proceso deterministico automatico de pseudo aleatorizacion de las opciones. Eso para que el usuario reciba rapido las generacion de preguntas, reciba feedback durante la generacion en el chat de lo que esta pasando (ejemplo: generando 1,2,3,...x de x preguntas, corrigiendo errores de formato, aleatorizando opciones, generacion finalizada - haz click en Resultados para ver las preguntas generadas) y proceda a dar los inputs que considere de ahi en adelante para inciar el proceso de nuevo parcial o total. Esa parte de reiniciar parcialmente la generacion es importante ya que el usuario va a querer adicionar preguntas o modificar x pregunta y el agente orquestador debe poder ejecutar el proceso parcialmente tambien. 

## Organizacion del plan y tasks

Debes crear dos documentos

- **Plan de Alto Nivel**
- **Documento de Tareas a realizar fraccionado en fases**

Crealos en /mddocs/ai_chat_mastra/. IMPORTANTE como primera tarea (Tarea 0) crear un feature branch y pasar el repo a ese branch
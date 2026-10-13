# Perceptrón simple — 4 entradas con tangente hiperbólica

Aplicación web (HTML + CSS + JavaScript orientado a objetos, sin frameworks) que entrena un perceptrón
simple de **4 entradas bipolares** (1 / −1) con activación **tangente hiperbólica** para resolver la
compuerta lógica del proyecto:

| X1 | X2 | X3 | X4 | Y |
|---:|---:|---:|---:|---:|
| −1 | −1 | −1 | −1 | −1 |
| −1 | −1 | −1 |  1 | −1 |
| −1 | −1 |  1 | −1 | −1 |
| −1 | −1 |  1 |  1 | −1 |
| −1 |  1 | −1 | −1 | −1 |
| −1 |  1 | −1 |  1 | −1 |
| −1 |  1 |  1 | −1 | −1 |
| −1 |  1 |  1 |  1 | −1 |
|  1 | −1 | −1 | −1 | −1 |
|  1 | −1 | −1 |  1 |  1 |
|  1 | −1 |  1 | −1 |  1 |
|  1 | −1 |  1 |  1 |  1 |
|  1 |  1 | −1 | −1 |  1 |
|  1 |  1 | −1 |  1 |  1 |
|  1 |  1 |  1 | −1 |  1 |
|  1 |  1 |  1 |  1 |  1 |

(Equivale a `Y = X1 AND (X2 OR X3 OR X4)`, que es linealmente separable, por eso el perceptrón converge.)

## Modelo

```
Y = tanh( w1·x1 + w2·x2 + w3·x3 + w4·x4 − θ )
salida = 1 si Y ≥ 0   ·   −1 si Y < 0
```

Si la salida difiere del valor esperado **Y** de la fila, se reajusta:

```
w1 = w1 + 2 · E · Y · x1
w2 = w2 + 2 · E · Y · x2
w3 = w3 + 2 · E · Y · x3
w4 = w4 + 2 · E · Y · x4
θ  = θ  + 2 · E · Y · (−1)
```

- **Iteración**: una pasada por las 16 filas. El entrenamiento termina cuando una iteración completa no tiene errores.
- **Reinicios**: si un intento pasa de 1000 iteraciones, se reinicia con pesos y umbral aleatorios (hasta 999 reinicios).
- **Valores de clase** (por defecto): w1 = 0,7 · w2 = 0,3 · w3 = 0,5 · w4 = 0,2 · θ = −2,2 · E = 0,6.
- **Empate (net = 0)**: Y = tanh(0) = 0 → salida 1. Sumas que a mano dan 0 (p. ej. 0,1 + 0,2 − 0,3) pero en la
  computadora dan ±0,00000000000000001 por el redondeo binario se toman como 0, igual que en Excel.
- **Valores permitidos**: cualquier número (pequeño, grande, con o sin decimales, negativo) entre −1 000 000 y
  1 000 000, con E > 0. Se escribe con punto decimal (0.5). Valores fuera de rango o vacíos muestran un aviso.
- **Formato**: los números se redondean como en Excel (0,015 → 0,02); los que son muy pequeños se muestran con
  sus cifras significativas (0.001, 1e-9) en lugar de 0.00.
- Con una E muy pequeña (p. ej. 0.000001) la neurona casi no se mueve: solo llega a la respuesta si algún reinicio
  aleatorio cae ya en una solución, así que puede terminar en "No llegó a la respuesta".

## Cómo ejecutar

Usa ES Modules, así que hay que servirlo por HTTP (no funciona con doble clic en `index.html`):

```bash
cd perceptron_simple-main
python3 -m http.server 8000
```

Abrir **http://localhost:8000/index.html**.

## Qué muestra la página

- La ecuación final `Y = tanh(…)` con los pesos aprendidos.
- Valores iniciales editables (w1–w4, θ, E) y botones **Entrenar**, **Valores de clase**, **Aleatorios**.
- Iteraciones, reinicios y pesos finales.
- Gráfica de la curva `tanh` con las 16 filas ubicadas según su entrada neta, y gráfica de errores por iteración.
- Tabla de entrenamiento fila por fila (una página por iteración) con el cálculo de `tanh` y, cuando hay error,
  las fórmulas de reajuste con los números sustituidos (igual que en la hoja de Excel de clase).
- Evaluación manual con cualquier número en x1–x4 (si no son 1/−1 se marca "fuera de la tabla") y evaluación de las 16 filas.

## Estructura (Clean Architecture)

```
├── index.html
├── main.js                         # Composition root: arma el AppController con el DOM
├── css/styles.css
└── src/
    ├── domain/
    │   ├── Sample.js               # Una fila: inputs [x1..x4] y valor esperado
    │   ├── EpochResult.js          # Fotografía de una iteración
    │   └── Perceptron.js           # tanh, clasificación por signo, regla de reajuste, train()
    ├── application/
    │   ├── GenerateDatasetUseCase.js     # Tabla de la compuerta (16 filas)
    │   ├── TrainPerceptronUseCase.js     # Entrena con valores iniciales + reinicios
    │   └── EvaluatePerceptronUseCase.js  # Evalúa las 16 filas o una entrada manual
    ├── infrastructure/
    │   ├── ChartRenderer.js        # Canvas: curva tanh y errores por iteración
    │   ├── formatNumber.js         # Redondeo tipo Excel y números muy pequeños/grandes
    │   └── TableRenderer.js        # Tablas paginadas de entrenamiento y evaluación
    └── presentation/
        └── AppController.js        # Conecta la UI con los casos de uso
```

Regla de dependencia: `domain` no conoce a nadie; `application` usa `domain`; `infrastructure` solo dibuja datos
ya calculados; `presentation` es la única capa que toca el DOM y une a las demás.

# 📐 Calculadora Estrutural Interativa (A3)

> **Resistência dos Materiais I** | Engenharia da Computação — Universidade São Judas Tadeu (USJT)

Uma aplicação web completa e interativa projetada para simulação, análise numérica e verificação de segurança de um sistema estrutural composto por uma viga principal biapoiada sustentada por tirantes verticais e conexões pino-chapa.

O software efetua o cálculo em tempo real do equilíbrio estático, traça os diagramas de esforços internos solicitantes (N, V, M), avalia o estado de tensões nos elementos e prevê o comportamento deformacional e a ordem de colapso da estrutura sob múltiplos tipos de carregamento.

## 🌐 Acesso Rápido

O projeto está publicado e pronto para uso direto no navegador, sem necessidade de instalação de dependências ou ambientes de desenvolvimento:

👉 [**Acessar a Calculadora Estrutural Interativa**](https://aquilesoliveira22master-hue.github.io/Calculadora-Estrutural/)

## ⚙️ Detalhamento dos Componentes Estruturais

```text
            D (Fixação Superior)
            │
            │ Barra BD (Tirante Superior)
            │
A ──────────B──────────C────────── (Viga Principal AC)
                        │
                        │ Barra CE (Tirante Inferior)
                        │
                        E (Fixação Inferior)
```

### 1. Viga Principal (Barra AC)

- **Função:** Elemento estrutural horizontal encarregado de receber os carregamentos diretos (pontuais, distribuídos e momentos) e transmiti-los aos pontos de apoio B e C.
- **Comportamento Mecânico:** Trabalha predominantemente à flexão simples/composta. Sofre momentos fletores M(x), esforços cortantes V(x) e esforço axial N(x) decorrente das componentes horizontais das cargas inclinadas.
- **Critério de Resistência:** A tensão normal combinada (\sigma = \frac{|N|}{A} + \frac{|M| \cdot c}{I}) é comparada com a tensão de escoamento (f_y) do material selecionado.

### 2. Barras de Apoio (Tirantes BD e CE)

- **Barra BD (Superior):** Conectada ao ponto B da viga e engastada/articulada no ponto fixo superior D.
- **Barra CE (Inferior):** Conectada ao ponto C da viga e engastada/articulada no ponto fixo inferior E.
- **Comportamento Mecânico:** Barras biarticuladas atuando sob esforço axial puro (tração N > 0 ou compressão N < 0).
- **Modelagem:** As forças de reação nos pontos B e C correspondem diretamente às forças axiais atuantes nessas barras (N_{BD} = R_B e N_{CE} = -R_C).

### 3. Conexões e Pinos (Ligações em B e C)

- **Função:** Elementos de junção entre a viga principal e as barras de sustentação.
- **Modo de Falha:** Avaliados quanto à ruptura por cisalhamento puro (\tau).
- **Configurações Suportadas:**
  - Cisalhamento Simples (1 plano de corte) ou Duplo (2 planos de corte).
  - Diâmetro (d) e quantidade de pinos por ligação (n).
  - Cálculo da área resistente total: A_{cis} = n \cdot m_{planos} \cdot \frac{\pi \cdot d^2}{4}.

## 📊 Carregamentos, Ângulos e Esforços

A aplicação permite a aplicação combinada de três classes de carregamento sobre o eixo da viga:

1. **Forças Concentradas (P):**
   - Posição x ao longo da viga (de 0 a L).
   - Intensidade em \text{kN} ou \text{N}.
   - **Orientação Angular (\theta):**
     - 270^\circ: Força vertical orientada para baixo (↓).
     - 90^\circ: Força vertical orientada para cima (↑).
     - 0^\circ ou $180^\circ$: Força puramente horizontal (→ ou ←).
     - **Ângulos Inclinados (ex: 45^\circ, 300^\circ):** Decomposição automática nas componentes P_x = P \cdot \cos(\theta) e P_y = P \cdot \sin(\theta). A componente horizontal P_x gera esforço normal $N(x)$ ao longo da viga até o apoio em $B$.
2. **Cargas Distribuídas (q):**
   - Abrangência entre posições x_1 e x_2.
   - Perfis: Uniforme (q_1 = q_2), Triangular (q_1 = 0 ou q_2 = 0) e Trapezoidal (q_1 \neq q_2).
3. **Momentos Concentrados (M_0):**
   - Torção pontual aplicada em x, com sentido horário (↻) ou anti-horário (↺).

## 📈 Deslocamentos e Deformação Elástica

O perfil deformado da estrutura (linha elástica) é obtido pela superposição dos deslocamentos axiais dos apoios e da deflexão por flexão da viga:

1. **Deformação Longitudinal dos Tirantes (\delta):**

   Calculada pela Lei de Hooke para cada barra vertical:

   $$\delta_{BD} = \frac{N_{BD} \cdot L_{BD}}{E_{BD} \cdot A_{BD}}, \qquad \delta_{CE} = \frac{N_{CE} \cdot L_{CE}}{E_{CE} \cdot A_{CE}}$$

   - Se BD se alonga (\delta > 0), o ponto B desce; se encurta, o ponto B sobe.
   - Se CE se alonga (\delta > 0), o ponto C sobe; se encurta, o ponto C desce.

2. **Deflexão da Viga por Flexão (v_{flexão}):**

   Obtida via dupla integração numérica da curvatura provocada pelo momento fletor:

   $$\frac{d^2v}{dx^2} = \frac{M(x)}{E \cdot I}$$

3. **Compatibilidade de Deslocamentos:**

   A rotação e o deslocamento de corpo rígido da viga são ajustados de modo que os pontos x = B e x = C coincidam exatamente com os deslocamentos \delta_{BD} e \delta_{CE} fornecidos pelas barras.

## 🛡️ Fator de Segurança (FS) e Diagnóstico

O programa classifica o estado de cada componente com base no Fator de Segurança (FS = \frac{\text{Tensão Limite}}{\text{Tensão Atuante}}):

- 🟢 **FS ≥ 1,5 (Seguro):** Componente operando dentro da margem de projeto.
- 🟡 **1,0 ≤ FS < 1,5 (Atenção):** Tensão próxima do limite elástico ou de ruptura.
- 🔴 **FS < 1,0 (Falha / Ruptura):** Sobrecarga com risco de escoamento do material ou corte dos pinos.

## 🚀 Simulador de Aumento de Carga (\lambda)

O controle deslizante de multiplicador de carga permite elevar progressivamente as forças atuantes de $\times 1{,}00 até \times 5{,}00, identificando a ordem de falha da estrutura (qual elemento atinge o colapso primeiro).

## 💻 Arquitetura de Software

```text
├── index.html   # Estrutura DOM, painéis de abas e formulários parametrizados
├── styles.css   # Estilização em CSS3 moderno, grid responsivo e tematização de status
└── script.js    # Motor de cálculo estrutural, renderizador de gráficos/canvas e gerador de PDF
```

## 👨‍💻 Autor

**Aquiles Alexandre Sanches de Oliveira**

*Engenharia da Computação — Universidade São Judas Tadeu (USJT)*
